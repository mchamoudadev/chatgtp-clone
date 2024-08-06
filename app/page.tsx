"use client"


import { FormEvent, useState, useRef, useEffect } from "react";
import ReactMarkdown from 'react-markdown'

interface Message {
  role: "user" | "assistant";
  content: string;
  type?: "text" | "image"
}



export default function Home() {




  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([])
  const [isGenerating, setIsGenerating] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null)


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(scrollToBottom, [messages])



  const handleSubmit = async (event: FormEvent) => {

    event.preventDefault();

    if (!input.trim()) return

    const userMessage: Message = { role: "user", content: input, type: "text" }


    setMessages((prev) => [...prev, userMessage]);

    setInput('');


    const isImagePrompt = input.toLowerCase().includes("generate image") || input.toLowerCase().includes("create image");

    const type = isImagePrompt ? "image" : "text";

    try {

      setIsGenerating(true)
      const response = await fetch('/api/generate', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input, type })
      });


      if (!response.ok) throw new Error(response.statusText);

      if (type === "image") {

        const data = await response.json();

        setMessages((prev) => [...prev, {
          role: "assistant", content: data.url
        }]);

      } else {


        const data = response.body;

        if (!data) return;

        const reader = data.getReader();

        const decoder = new TextDecoder();

        let assistantMessage: Message = { role: "assistant", content: "", type: "text" }


        setMessages((prev) => [...prev, assistantMessage]);

        let done = false;

        while (!done) {

          const { value, done: doneReading } = await reader.read()

          done = doneReading

          const chunkValue = decoder.decode(value);

          assistantMessage.content += chunkValue

          setMessages((prev) => {
            const newMessage = [...prev];

            newMessage[newMessage.length - 1] = { ...assistantMessage }

            return newMessage
          })
        }
      }

      setIsGenerating(false)
    } catch (error) {
      setIsGenerating(false)
      console.log("error", error)
    }

  }



  return (
    <main className="flex flex-col h-screen max-w-3xl  mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">AI Assistance</h1>
      <div className="flex-grow overflow-auto mb-4 space-y-4 pb-4">

        {

          messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} `}>
              <div className={`max-w-[70%] p-3 rounded-lg ${message.role === "user" ? "bg-rose-500 text-white" : "bg-gray-100"}`}>

                <div className={`font-bold mb-1`}>

                  {message.role === "user" ? "You" : "Assintant"}

                </div>

                <div className={`${message.role === "user" ? "text-white" : "text-black"}`}>
                  {
                    message.type === "text" ? (
                      <ReactMarkdown className="prose">{message.content}</ReactMarkdown>
                    ) : (

                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={message.content} alt="Message generated" />
                    )
                  }
                </div>
              </div>
            </div>
          ))
        }

        <div ref={messagesEndRef} />
      </div>


      <form
        className="flex space-x-2"
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          placeholder="Type a message...."
          className="flex-grow p-2 border border-gray-300 rounded outline-rose-600"
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <button
          disabled={isGenerating}
          type="submit"
          className={`disabled:cursor-not-allowed p-2 ${isGenerating ? "bg-rose-500" : "bg-rose-600"}  rounded text-white hover:bg-red-500`}
        >
          {isGenerating ? "Generaing" : "Generate"}
        </button>
      </form>
    </main>
  );
}
