import React, {useState, useEffect} from 'react'
import { Table, Button, notification, Typography } from 'antd';
import copy from 'copy-to-clipboard'
import { CopyOutlined,ReloadOutlined} from '@ant-design/icons';
import Axios from 'axios';

const { Paragraph } = Typography
export default function SNDataTable({SNdata}) {
    const [selectedRowKeys, setSelectedRowKeys] = useState([])
    const [loadings, setLoadings] = useState([])
    const [tableData, setTableData] = useState([])
    

    /*******************Getting data straight from cisco */
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
    const reload = async () =>{
     
       enterLoading(1,true)
        
        //Get Token
        const token = await Axios.get("http://apisn.ipsupply.net:2580/api/authToken")
        
       for(const item of selectedRowKeys){
          const sn = tableData[item].snInnerText;
          const reloadData = await getDataFromCisco(sn,token.data);

          //Bind data from response to object
          const {serialNumber} = reloadData.data.data[0];
          const {name, description} = reloadData.data.data[0].product;
          const serviceLevel = reloadData.data.data[0].serviceLevel ? reloadData.data.data[0].serviceLevel.name + " - "+reloadData.data.data[0].serviceLevel.description: "null";
          
          //bind new data to existing object
          tableData[item].snInnerText = serialNumber;
          tableData[item].name = name;
          tableData[item].description = description;
          tableData[item].serviceLevel = serviceLevel
          tableData[item].serialNumber = <Paragraph copyable={{ text: serialNumber+" - "+name }}>{serialNumber}</Paragraph>
          setTableData([...tableData])
        }
        
        enterLoading(1,false)
        openNotificationWithIcon('success', selectedRowKeys.length+ ' Item(s) reload successfully', 'Reloaded')
    }

    const enterLoading = (index, status) =>{
      const newLoadings = [...loadings];
      newLoadings[index] = status; 
      setLoadings(newLoadings)
    }

    const copySelection = () =>{
      if(selectedRowKeys.length === 0){
        openNotificationWithIcon('warning', "None selection detected")
      } else {
        const clipboardArray = selectedRowKeys.map(index =>{
          return tableData[index].snInnerText + " - "+ tableData[index].name
        })
        copy(clipboardArray.join("\n"))
        openNotificationWithIcon('success', "Copy Successful")
      }
    }

    const onSelectChange = selectedRowKeys =>{
        setSelectedRowKeys(selectedRowKeys)
    }

    const openNotificationWithIcon = (type,description,title) => {
      notification[type]({
        message: title,
        description:
          description,
      });
    };

    
    const hasSelected = selectedRowKeys.length > 0;
    const columns = [
      {
        title: 'Flag',
        dataIndex: 'disabledLineFlagMsgs',
        key:'disabledLineFlagMsgs',
      },
        {
          title: 'Product SN',
          dataIndex: 'serialNumber',
          key:'serialNumber',
        },
        {
          title: 'Product Name',
          dataIndex: 'name',
          key:'name'
        },
        {
          title: 'Product Description',
          dataIndex: 'description',
          key:'description'
        },
        {
            title:'Service Level',
            dataIndex:'serviceLevel',
            key:'serviceLevel'
        }
      ];
      
      const rowSelection = {
          selectedRowKeys,
          onChange:onSelectChange
      }
      
      
      useEffect(() => {
        setTableData([...SNdata])
      }, [SNdata])

      const config = {
        pagination:{
          pageSizeOptions: ['50','100'],
          showSizeChanger: true,
          pageSize: 50
        }
      }
      
    return (
        <div>
        <div style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={copySelection} disabled={!hasSelected} loading={loadings[0]} icon={<CopyOutlined /> } className="action-btn">
          Copy
        </Button>
        <Button type="primary" onClick={reload} disabled={!hasSelected} loading={loadings[1]} icon={<ReloadOutlined />} className="action-btn">
          Reload From Cisco
        </Button>
          
          <span style={{ marginLeft: 8 }}>
            {hasSelected ? `Selected ${selectedRowKeys.length} items` : ''}
          </span>
        </div>
        <Table {...config} rowSelection={rowSelection} columns={columns} dataSource={tableData} rowKey={(el)=>{return el.id}} />
      </div>
    )
}
