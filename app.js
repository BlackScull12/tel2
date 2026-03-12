import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDocs, addDoc, updateDoc, onSnapshot, query, orderBy, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

export const firebaseConfig = {
apiKey: "AIzaSyAxt94UyMn8AP8PFaSHPJ29JnZQ2KI3kZw",
authDomain: "chatgithub-e838d.firebaseapp.com",
projectId: "chatgithub-e838d",
storageBucket: "chatgithub-e838d.firebasestorage.app",
messagingSenderId: "755589384017",
appId: "1:755589384017:web:6af4c6d223d646cf36f570"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

const googleBtn = document.getElementById("googleLogin");
const usersList = document.getElementById("usersList");
const chatBox = document.getElementById("chatBox");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearChat");
const emojiBtn = document.getElementById("emojiBtn");
const emojiPicker = document.getElementById("emojiPicker");

let currentUser = null;
let chatID = null;
let currentChatUser = null;

const emojis = ["😀","😁","😂","🤣","😃","😄","😅","😊","😍","😘","😎","😢","😭","😡","🤔","🤯","🥳","👍","👏","🙏","🔥","❤️","🎉","✨"];

document.addEventListener("DOMContentLoaded", () => {

if (googleBtn) {
googleBtn.addEventListener("click", async () => {
try{
const result = await signInWithPopup(auth, provider);
const user = result.user;

await setDoc(doc(db,"users",user.uid),{
name:user.displayName,
email:user.email,
photo:user.photoURL||"",
online:true
},{merge:true});

window.location.href="chat.html";
}catch(error){
console.error(error);
alert(error.message);
}
});
}

onAuthStateChanged(auth, async (user)=>{

if(!user) return;

currentUser=user;

await updateDoc(doc(db,"users",user.uid),{online:true}).catch(()=>{});

if(usersList) loadUsers();

});

if(sendBtn) sendBtn.onclick=sendMessage;

if(input){
input.addEventListener("keypress",(e)=>{
if(e.key==="Enter") sendMessage();
});
}

if(clearBtn) clearBtn.onclick=clearChat;

if(emojiPicker){
emojis.forEach(e=>{
const span=document.createElement("span");
span.className="emoji";
span.innerText=e;
span.onclick=()=>{input.value+=e};
emojiPicker.appendChild(span);
});
}

if(emojiBtn){
emojiBtn.onclick=()=>{
emojiPicker.style.display =
emojiPicker.style.display==="flex"?"none":"flex";
};
}

});

async function loadUsers(){

usersList.innerHTML="";

const snapshot=await getDocs(collection(db,"users"));

snapshot.forEach((docu)=>{

if(docu.id===currentUser.uid) return;

const user=docu.data();

const div=document.createElement("div");
div.className="userRow";

const img=document.createElement("img");
img.src=user.photo||"";
img.className="avatar";

const name=document.createElement("span");
name.innerText=user.name;

div.appendChild(img);
div.appendChild(name);

div.onclick=()=>openChat(docu.id,user.name);

usersList.appendChild(div);

});

}

function openChat(uid,name){

document.getElementById("chatUser").innerText=name;

currentChatUser=uid;

chatID=[currentUser.uid,uid].sort().join("_");

listenMessages();

}

function listenMessages(){

chatBox.innerHTML="";

const messagesQuery=query(
collection(db,"chats",chatID,"messages"),
orderBy("time","asc")
);

onSnapshot(messagesQuery,(snapshot)=>{

chatBox.innerHTML="";

snapshot.forEach((docu)=>{

const msg=docu.data();

const bubble=document.createElement("div");

bubble.className=msg.sender===currentUser.uid?"sender":"receiver";

bubble.innerText=msg.text;

chatBox.appendChild(bubble);

});

chatBox.scrollTop=chatBox.scrollHeight;

});

}

async function sendMessage(){

if(!input.value||!chatID) return;

await addDoc(collection(db,"chats",chatID,"messages"),{
text:input.value,
sender:currentUser.uid,
time:Date.now()
});

input.value="";

}

async function clearChat(){

if(!chatID) return;

const confirmDelete=confirm("Clear chat?");

if(!confirmDelete) return;

const messagesRef=collection(db,"chats",chatID,"messages");

const snapshot=await getDocs(messagesRef);

snapshot.forEach(async (docu)=>{
await deleteDoc(doc(db,"chats",chatID,"messages",docu.id));
});

}
