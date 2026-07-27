import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, onValue, runTransaction, set, get } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyAMUXF60BmscAzYEd0-tevmejWhkERNQQ4",
  authDomain: "particle-1b28d.firebaseapp.com",
  databaseURL: "https://particle-1b28d-default-rtdb.firebaseio.com",
  projectId: "particle-1b28d",
  storageBucket: "particle-1b28d.firebasestorage.app",
  messagingSenderId: "560962966684",
  appId: "1:560962966684:web:3bb3e5174fc8288819c959",
  measurementId: "G-E03J667KT2"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);

let currentFilter = "all";

// CHECK IF THIS BROWSER ALREADY LIKED
let hasLiked = localStorage.getItem("padisLiked") === "true";

// CREATE siteStats if it doesn't exist
get(ref(db, "siteStats/totalLikes")).then((snap) => {
  if(!snap.exists()){
    set(ref(db, "siteStats/totalLikes"), 0);
  }
});

// SHOW LIKES LIVE FROM FIREBASE
onValue(ref(db, "siteStats/totalLikes"), (snap) => {
  document.getElementById("likeamount").innerText = snap.val() || 0;
});

// SET BUTTON COLOR ON LOAD
window.addEventListener("load", () => {
  if(hasLiked){
    document.getElementById("like").style.backgroundColor = "red";
    document.getElementById("like").disabled = true;
  }
});

// GLOBAL LIKE BUTTON
document.getElementById("like").addEventListener("click", () => {
    if(hasLiked) return;

    document.getElementById("loves").classList.remove("non-active");
    setTimeout(()=> document.getElementById("loves").classList.add("non-active"), 2000);

    const likeRef = ref(db, "siteStats/totalLikes");
    runTransaction(likeRef, (current) => (current || 0) + 1 );
    
    hasLiked = true;
    localStorage.setItem("padisLiked", "true");
    document.getElementById("like").style.backgroundColor = "red";
    document.getElementById("like").disabled = true;
});

// GLOBAL SHARE BUTTON - for website
document.getElementById("share").addEventListener("click", async () => {
  const shareData = { title: "Padis Article", text: "Check out new content on Padis Article!", url: window.location.href };
  try { await navigator.share(shareData); }
  catch { navigator.clipboard.writeText(shareData.url); alert("Link copied!"); }
});

// LOAD ARTICLES
function loadArticles() {
  const container = document.getElementById("articles-container");
  onValue(ref(db, "articles"), (snapshot) => {
    container.innerHTML = "";
    snapshot.forEach((child) => {
      const id = child.key;
      const a = child.val();
      if(currentFilter === "all" || a.category === currentFilter){
        let media = "";
        if(a.mediaType === "video") media = `<video src="${a.mediaUrl}" controls crossorigin="anonymous"></video>`;
        else if(a.mediaType === "image") media = `<img src="${a.mediaUrl}" alt="${a.title}" crossorigin="anonymous">`;

        // Get first 120 characters for preview
        let previewText = a.content.length > 120 ? a.content.substring(0, 120) + "..." : a.content;

        container.innerHTML += `
          <div class="article-card" id="article-${id}">
            <button class="download-btn" onclick="downloadContent('${id}', '${a.mediaType}')"><i class="fa-solid fa-download"></i> Download</button>
            ${media}
            <h2>${a.title}</h2>
            <p>${a.content}</p>
            <div class="article-actions">
              <button class="share-article-btn" onclick="shareArticle('${id}', \`${a.title}\`, \`${previewText}\`, \`${a.mediaUrl}\`)">
                <i class="fa-solid fa-share"></i> Share This Post
              </button>
            </div>
          </div>
        `;
      }
    });
  });
}
loadArticles();

// SHARE INDIVIDUAL ARTICLE
window.shareArticle = async (id, title, preview, mediaUrl) => {
  const articleUrl = `${window.location.href}#article-${id}`; // link directly to that article
  
  const shareData = {
    title: title,
    text: `${title}\n\n${preview}`, // title + first lines
    url: articleUrl
  };

  try {
    // If phone supports sharing files/images
    if (navigator.canShare && navigator.canShare({ files: [] })) {
      // Note: sharing actual image file needs fetch. For now we share link + text
      await navigator.share(shareData);
    } else {
      await navigator.share(shareData);
    }
  } catch(err) {
    // Fallback: copy to clipboard
    const copyText = `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`;
    navigator.clipboard.writeText(copyText);
    alert("Article link copied! Paste to WhatsApp/Facebook");
  }
}

// DOWNLOAD FUNCTION
window.downloadContent = async (id, mediaType) => {
  const card = document.getElementById(`article-${id}`);
  if(mediaType === "video"){
    const videoUrl = card.querySelector("video").src;
    const a = document.createElement('a');
    a.href = videoUrl; a.download = `padis-video-${id}.mp4`; a.target = "_blank"; a.click();
  } else {
    const canvas = await html2canvas(card, {useCORS: true, allowTaint: false});
    const link = document.createElement('a');
    link.download = `padis-article-${id}.png`;
    link.href = canvas.toDataURL();
    link.click();
  }
}

// FILTER
document.querySelectorAll(".cat-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.cat;
    loadArticles();
  });
});