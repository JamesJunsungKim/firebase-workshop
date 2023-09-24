"use client";

import {Button, Drawer, Input, InputBase} from "@mui/material";
import Image from 'next/image'
import styles from './page.module.css'
import './globals.css'
import {useEffect, useState} from "react";
import {useRouter, useSearchParams} from 'next/navigation';
import {initializeApp} from "firebase/app";
import {getFirestore} from "firebase/firestore";
import {collection, addDoc, onSnapshot, getDocs, query, limit, where, getDoc, orderBy} from "firebase/firestore";

const Home = () => {
    const searchParams = useSearchParams()
    const [state, setState] = useState({
        chatID: 'chat1',
        senderID: '',
        messages: [],
        currentMessage: '',
        db: null
    })

    useEffect(() => {
        // get senderID from query. if not found, it's user1
        const senderID = searchParams.get("id") || "user1"

        // setup firebase app
        // PS. this is not secure, but it's ok for this demo
        const firebaseConfig = {
           // TODO: add your firebase config here
        };

        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);

        setState(prevState => {
            return {
                ...prevState,
                db: db,
                senderID: senderID
            }
        })

        // connect to firestore
        const col = collection(db, 'chats', state.chatID, 'messages')
        // query based on timestamp
        const q = query(col, orderBy('timestamp', 'asc'))

        onSnapshot(q, (doc) => {
            doc.docChanges().forEach((change) => {
                if (change.type != 'added') {
                    return
                }

                const json = change.doc.data()
                // check if json is valid
                if (!json || !json.id) {
                    return
                }

                setState(prevState => {
                    // check if message is already in state
                    const found = prevState.messages.find((message) => {
                        return message.id == json.id
                    })

                    if (found) {
                        return { ...prevState }
                    }

                    // add message to state
                    return {
                        ...prevState,
                        messages: prevState.messages.concat(json)
                    }
                })
            })
        })


    }, [])

    const uuidv4 = () => {
        return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }

    const didClickOnSendButton = () => {
        const body = {
            id: uuidv4(),
            senderID: state.senderID,
            chatID: state.chatID,
            type: "text",
            message: state.currentMessage,
            timestamp: Date.now()
        }

        // add message to firestore
        addDoc(collection(state.db, 'chats', state.chatID, 'messages'), body)

        // clear input
        // add message to state
        setState(prevState => {
            return {
                ...prevState,
                currentMessage: '',
                messages: prevState.messages.concat(body)
            }
        })

        // scroll to bottom
        const chatContainer = document.querySelector('.chat-container')
        chatContainer.scrollTop = chatContainer.scrollHeight
    }

    return (
        <main className={styles.main}>
            <div className={"chat-container"}>
                <h2>
                    Your userID is {state.senderID}.
                </h2>

                <div className={"message-container"}>
                    {
                        state.messages.map((message) => {
                            console.log(message.senderID, state.senderID)
                            return (
                                // depending on the sender, we'll show the message on the left or right
                                <div
                                    key={message.id}
                                    style={{display: "flex", justifyContent: message.senderID == state.senderID ? 'flex-end' : 'flex-start'}}
                                >
                                    <div
                                        className={message.senderID == state.senderID ? "message-sender-container" : "message-receiver-container"}
                                    >
                                        {
                                            message.message
                                        }
                                    </div>
                                </div>
                            )
                        })
                    }
                </div>

            </div>

            <div className={"input-container"}>
                <InputBase
                    sx={{flex: 1, fontSize: 22, fontWeight: '500', width: '100%'}}
                    placeholder={"Type a message"}
                    inputProps={{'aria-label': 'naked'}}
                    value={state.currentMessage}
                    onInput={(e) => {
                        const value = e.target.value
                        setState(prevState => {
                            return {
                                ...prevState,
                                currentMessage: value
                            }
                        })
                    }}
                />

                <Button
                    variant={"contained"}
                    onClick={didClickOnSendButton}
                    disabled={state.currentMessage.length == 0}
                >
                    Send
                </Button>
            </div>
        </main>
    )
}

export default Home
