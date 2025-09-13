import React, { useState, useEffect } from 'react'
import './App.css';

function App() {
  const [state, setState] = useState({"test_num" : 0, "name": "user1", "button_pressed" : 0, "sum_of_pressed" : 0})
  
  const handleSkillClick = (button) => {
      setState(prev => ({ ...prev, button_pressed: button }));
    };

  const sendStateToServer = async (cur_state) => {
    try {
      console.log(state)
      const modified_state = {
        ...state,
        "button_pressed" : cur_state["button_pressed"]
      }

      const response = await fetch ('/api/update-state', {
        method : 'POST', 
        headers: {
          'Content-Type':'application/json'
        }, 
        body: JSON.stringify({
          state: modified_state
        })
      })
      const data = await response.json();
      setState(data);
    } catch (error){
      console.log("Error: ", error)
    }
  }

  return (
    <div className="App">
      <h1>Sheepish</h1>
      <p>Sum of Pressed: {state["sum_of_pressed"]}</p>
      <button type="Option"  onClick = {() => handleSkillClick(1)}>
          Button 1
      </button>
      <button type="Option"  onClick = {() => handleSkillClick(2)}>
          Button 2
      </button>
      <button type="button"  onClick = {() => sendStateToServer(state)}>
          Send
      </button>
    </div>
  );
}

export default App;
