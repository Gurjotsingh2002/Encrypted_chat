import "./chat.scss";
import { to_Decrypt, to_Encrypt } from "../aes.js";
import { process } from "../store/action/index";
import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import 'bootstrap/dist/css/bootstrap.min.css';
import {Form} from "react-bootstrap";

function Chat({ username, roomname, socket }) {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [file, setFile] = useState();
  const dispatch = useDispatch();

  const dispatchProcess = (encrypt, msg, cipher) => {
    dispatch(process(encrypt, msg, cipher));
  };

  useEffect(() => {
    socket.on("message", (data) => {
      //decypt
      const ans = to_Decrypt(data.text, data.username);
     dispatchProcess(false, ans, data.text);
      if(ans.substr(0, 10)==="data:image"){
        console.log("Decrypted Image: ", ans);
        let temp = messages;
        temp.push({
          userId: data.userId,
          username: data.username,
          image: ans,
          text: null
        });
        setMessages([...temp]);
      }else{
        console.log("Decrypted Text: ", ans);
        let temp = messages;
        temp.push({
          userId: data.userId,
          username: data.username,
          text: ans,
          image: null
        });
        setMessages([...temp]);
      }
    });
  }, [socket]);
  const sendData = () => {
    if (text !== "") {
      //encrypt here
      const ans = to_Encrypt(text);
      console.log("Encrypted text: ", ans);
      socket.emit("chat", ans);
      setText("");
    }else{
      const ans = to_Encrypt(file);
      console.log("Encrypted Image: ", ans);
     socket.emit("chat", ans);
     setFile(null);
    }
  };
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  };

  const getBase64 = (file) => {
    var reader = new FileReader();
    reader.readAsDataURL(file);  //The readAsDataURL method is used to read the contents of the specified Blob or File. 
                                  //When the read operation is finished, the readyState becomes DONE, and the loadend is triggered. 
                                 //At that time, the result attribute contains the data as a data: URL representing 
                                   //the file's data as a base64 encoded string.
    reader.onload = () => {
      setFile(reader.result);
    };
    reader.onerror =  (error) => {
      console.log('Error: ', error);
    };
 }
 

  useEffect(scrollToBottom, [messages]);

  //console.log(messages, "mess");

  return (
    <div className="chat">
      <div className="user-name">
        <h2>
          {username} <span style={{ fontSize: "0.7rem" }}> is in Room {roomname}</span>
        </h2>
      </div>
      <div className="chat-message">
        {messages.map((i) => {
          if (i.username === username) {
            if(i.image===null){
              return (
                <div className="message" key={i.text}>
                  <p>{i.text}</p>
                  <span>{i.username}</span>
                </div>
              );
            }else{
              return(<div className="message" key={i.image}>
              <img src={i.image} alt="Img" className="img-styled"/>
              <span>{i.username}</span>
            </div>)
            }
          } else {
            if(i.image===null){
              return (
                <div className="message mess-right" key={i.text}>
                  <p>{i.text} </p>
                  <span>{i.username}</span>
                </div>
              );
            }else{
              return (
                <div className="message mess-right" key={i.image}>
                  <img src={i.image} alt="Img" className="img-styled"/>
                  <span>{i.username}</span>
                </div>
              ); 
            }
          }
        })}
        <div ref={messagesEndRef} />
      </div>
      <div className="send">
      <Form.Group controlId="formFile" className="mb-3" style={{marginRight: "10vw"}}> 
    <Form.Control type="file" onChange={(event)=>getBase64(event.target.files[0])}/>
  </Form.Group>
        <input
          placeholder="enter your message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              sendData();
            }
          }}
        ></input>
        <button onClick={sendData}>Send</button>
      </div>
    </div>
  );
}
export default Chat;
