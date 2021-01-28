import React,{useState, useEffect} from 'react'
import { Table, Button, notification, Typography } from 'antd';
import { CopyOutlined, ReloadOutlined} from '@ant-design/icons';
import Axios from 'axios'
import copy from 'copy-to-clipboard'
const { Paragraph } = Typography
export default function SNDataErrorTable({errorData, passToParent}) {
    const [selectedRowKeys, setSelectedRowKeys] = useState([])
    const [dataErrorTable, setDataErrorTable] = useState([])
    const [loadings, setLoadings] = useState([])


    /*****************Getting data straight from cisco site */
    const getDataFromCisco = async (sn,authToken) =>{
      const url ="https://cors-anywhere.herokuapp.com/https://ccrc.cisco.com/ServiceContract/ccrcsearch/oneview/lines";
      var bodyJsonObj = {
      "expandAllMinorToMajor": false,
      "fields": [],
      "filters": {
      "aggregationsOnly": false,
      "includeUncoveredLines": false,
      "lastFilter": null,
      "showAggregations": true,
      "values": {},
      "viewAllContractItems": false
      },
      "page": 1,
      "pageSize": 25,
      "search": {"key": "serialNumber", "value": `${sn}`},
      "sort": {"key": "CONTRACT_NUMBER", "value": "ASC"}
      };

      const options = {
        headers:{
          'authorization':authToken,
          'Request-Id': 123456
        }
      }
      const result = await Axios.post(url, bodyJsonObj, options)
      return result
      
    }

    /****************************Reload all the selection******************** */
    const reload = async () =>{
     
      enterLoading(1,true)
       
       //Get Token
       const token = await Axios.get("http://apisn.ipsupply.net:2580/api/authToken")
       
      for(const item of selectedRowKeys){
         const sn = dataErrorTable[item].snInnerText;
         const reloadData = await getDataFromCisco(sn,token.data);
        
         //Bind data from response to object
         if(reloadData.data.data.length > 0){
          const {serialNumber} = reloadData.data.data[0];
          const {name, description} = reloadData.data.data[0].product;
          const serviceLevel = reloadData.data.data[0].serviceLevel ? reloadData.data.data[0].serviceLevel : "null";
          
          //create a new Object
          
          dataErrorTable[item].snInnerText = serialNumber;
          dataErrorTable[item].name = name;
          dataErrorTable[item].description = description;
          dataErrorTable[item].serviceLevel = serviceLevel
          dataErrorTable[item].serialNumber = <Paragraph copyable={{ text: serialNumber+" - "+name }}>{serialNumber}</Paragraph>

          //Pass it back to App.js then pass to SN Data Table
          passToParent(dataErrorTable[item])
          const currentIndex = dataErrorTable.indexOf(dataErrorTable[item])
          dataErrorTable.splice(currentIndex,1)
         }
         dataErrorTable[item].errorMsg = "SN Not Found on Official Cisco"
         setDataErrorTable([...dataErrorTable])
       }
       
       enterLoading(1,false)
       openNotificationWithIcon('success', selectedRowKeys.length+ ' Item(s) reload successfully', 'Reloaded')
    }
    //if unsuccessful do what
    const onSelectChange = selectedRowKeys =>{
        setSelectedRowKeys(selectedRowKeys)
    }

    const hasSelected = selectedRowKeys.length > 0;
    
    /*************************Copy all selection to clipboard */
    const copySelection = () =>{
      enterLoading(0,true)
      if(selectedRowKeys.length === 0){
        openNotificationWithIcon('warning', "None selection detected")
      } else {
        const clipboardArray = selectedRowKeys.map(index =>{
          return dataErrorTable[index].snInnerTex
        })
        copy(clipboardArray.join("\n"))
        openNotificationWithIcon('success',clipboardArray.length +" item(s) Copied" ,"Copy Successful")
      }
      enterLoading(0,false)
    }

    const openNotificationWithIcon = (type,description,title) => {
      notification[type]({
        message: title,
        description:
          description,
      });
    };

    const enterLoading = (index) =>{
      const newLoadings = [...loadings];
      newLoadings[index] = true;
      
      setLoadings(newLoadings)
      
      setTimeout(()=>{
        const newLoadings = [...loadings];
        newLoadings[index] = false;
        setLoadings(newLoadings)
      },1000)
    }
    const columns = [
        {
          title: 'Product SN',
          dataIndex: 'serialNumber',
          key:'serialNumber'
        },
        {
          title: 'Error Message',
          dataIndex: 'errorMsg',
          key:'errorMsg'
        }
      ];
      
      const rowSelection = {
          selectedRowKeys,
          onChange:onSelectChange
      }

      useEffect(() => {
        setDataErrorTable([...errorData])
      }, [errorData])

    return (
        <div id="error-table" >
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" onClick={copySelection} disabled={!hasSelected} loading={loadings[0]} icon={<CopyOutlined /> } className="action-btn">
            Copy
          </Button>
          <Button type="primary" onClick={reload} disabled={!hasSelected} loading={loadings[1]} icon={<ReloadOutlined />}>
            Reload From Cisco
          </Button>
          <span style={{ marginLeft: 8 }}>
            {hasSelected ? `Selected ${selectedRowKeys.length} items` : ''}
          </span>
        </div>
        <Table rowSelection={rowSelection} columns={columns} dataSource={dataErrorTable} rowKey={(el)=>{return el.id}} />
      </div>
    )
}
