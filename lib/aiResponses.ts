export const generateAIResponse = () => {
  const predefinedResponses = [
    "That's interesting! Tell me more.",
    "I see what you're saying. What do you think about...?",
    "Could you clarify that a bit?",
    "That's a great point! Let's dive deeper.",
    "I'm not sure I understand. Can you elaborate?",
    "Interesting perspective! What about...?",
    "Could you provide an example?",
  ];
  
  const simulatedResponse = predefinedResponses[Math.floor(Math.random() * predefinedResponses.length)]
  return simulatedResponse;
};
  