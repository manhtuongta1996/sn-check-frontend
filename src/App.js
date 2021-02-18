import React, {useState, useEffect} from 'react'
import './App.css';
import { Input, Button,Typography, notification, Space, Progress, Tooltip } from 'antd';
import 'antd/dist/antd.css'; // or 'antd/dist/antd.less'
import SNDataTable from './components/SNDataTable';
import SNDataErrorTable from './components/SNDataErrorTable';
import { SearchOutlined ,FlagOutlined , CheckCircleOutlined} from '@ant-design/icons';
import CronTaskProgress from './components/CronTaskProgress';
const { Paragraph, Text } = Typography;
const axios = require('axios')
const { TextArea } = Input;

function App() {
  const [input, setInput] = useState([])
  const [loadings, setLoadings] = useState([])
  const [resultData, setResultData] = useState([])
  const [resultDataError, setResultDataError] = useState([])

  
  const inputOnChange = (e) =>{
    let value = e.target.value.split(/\r|\r\n|\n|;|,|[ ]/)
    value = value.filter(item=>item !== "").map(item=>encodeURIComponent(item.toUpperCase()))

    //Get unique value if there is duplication
    const uniqValueOnly = [...new Set(value)]
    setInput(uniqValueOnly)
  }

  const enterLoading = (index, status) =>{
    const newLoadings = [...loadings];
    newLoadings[index] = status;
    setLoadings(newLoadings)
  }
  const openNotificationWithIcon = (type,description,title) => {
    notification[type]({
      message: title,
      description:
        description,
    });
  };


  const fireRequest = async () =>{
    if(input.length === 0 ){
      openNotificationWithIcon('error', 'Please enter one or more SN', "None input detected !")
      return
    }
    //Reset all data of table
    setResultDataError([])
    setResultData([])
    enterLoading(0,true)
    //function getting the result
    const getResult = async (item) =>{
      const resultPromise = new Promise((resolve, reject) =>{
        axios.get('http://apisn.ipsupply.net:2580/api/check-sn/'+item).then(response =>{
          resolve(response)
        }).catch(err=>resolve(err))
      })

      const result = await resultPromise

      return result
    }
    let newResultData = []
    let newResultDataError = []
    for(let [index,item] of input.entries()){

      //If item is 12-character length and the first character is S => then remove S
      if(item.length === 12 && item[0] === "S"){
        item = item.substr(1)
      }
        const result = await getResult(item)
        
      
      if(result.response !== undefined){

        //If Error
        const errorObject = {
          serialNumber: <Paragraph copyable>{item}</Paragraph>,
          errorMsg: result.response.data,
          snInnerText:item,
          id:index
        }
        newResultDataError = [...newResultDataError, errorObject]
        setResultDataError(newResultDataError)
      } else {

        //No error
        const {serialNumber, serviceLevel,disabledLineFlagMsgs} = result.data;
        const {name, description} = result.data.Product
        const objectData = {
          serialNumber:<Paragraph copyable={{ text: serialNumber+" - "+name }}>{serialNumber}</Paragraph>,
          name,
          description,
          serviceLevel,
          snInnerText: serialNumber,
          disabledLineFlagMsgs:disabledLineFlagMsgs?.length > 0 ?<Tooltip placement="topLeft" title={disabledLineFlagMsgs} arrowPointAtCenter><FlagOutlined style={{fontSize:'20px'}}  /></Tooltip> : <CheckCircleOutlined  style={{fontSize:'20px', color:"#52C41A"}} />,
          id: index
        }
        newResultData = [...newResultData,objectData]
        setResultData(newResultData)
      }
    }
      enterLoading(0,false)
  }

  const getValIfReloadSucceedFromError = (value) =>{
    value.id = input.length > 0 ? input.length : 0
    setResultData([...resultData, value])
  }

  
  
  return (
    <div className="App">
      <div className="app-header">
        <h1 id="app-title">SN CHECK APP</h1>
      </div>
      <div className="container">
        <div id="user-input">
          <Space direction="horizontal">{input.length} Item(s)</Space>
          <div id="input-progress">
            <div id="snInput">
              <TextArea rows={4} onChange={(e) => {inputOnChange(e)}}/>
            </div>
            {(resultData.length >0 || resultDataError.length>0) && input.length > 0 ? <div id="progress">
              {(resultData.length >0 || resultDataError.length>0) && <Progress percent={Math.ceil((resultData.length+resultDataError.length)/input.length*100)} size="small" format={()=><Text type="success">{resultData.length+resultDataError.length} Received</Text>}/>}
              {resultData.length >0 && <Progress percent={resultData.length/input.length*100} size="small" status="active" format={()=><Text type="primary">{resultData.length}/{input.length} Succeed</Text>}/>}
              {resultDataError.length > 0 && <Progress percent={resultDataError.length/input.length*100} size="small" status="exception" format={()=><Text type="danger">{resultDataError.length}/{input.length} Failed</Text>}/>}
            </div> : ""}
          </div>
          
          <Button type="primary" loading={loadings[0]} onClick={() => {fireRequest()}} id="search-btn" icon={<SearchOutlined />} className="action-btn">
            Search
          </Button>
          
        </div>
        <div id="SN-data-table">
          <SNDataTable SNdata={resultData} bordered={true}/>
          {resultDataError.length > 0 && <SNDataErrorTable errorData = {resultDataError} passToParent={getValIfReloadSucceedFromError}/>}
        </div>
      </div>
    </div>
  );
}

export default App;
