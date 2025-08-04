const blogId = document.getElementById("blogId").value.trim() || "3812927193244872888";

document.getElementById("publishPost").addEventListener("click", () => {
  const title = document.getElementById("postTitle").value.trim();
  const content = document.getElementById("htmlOutput").value.trim();
  const labelsInput = document.getElementById("postLabels").value.trim();

  const labels = labelsInput
    ? labelsInput.split(",").map(label => label.trim()).filter(label => label.length > 0)
    : [];

  if (!accessToken || !title || !content) {
    alert("⚠️ Faltan datos obligatorios o no has iniciado sesión.");
    return;
  }

  fetch(`https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      kind: "blogger#post",
      title,
      content,
      labels
    })
  })
    .then(res => res.json())
    .then(data => {
      alert("✅ Publicado en Blogger:\n" + data.url);
      .then(data => {
  alert("✅ Publicado en Blogger:\n" + data.url);
  // window.open(data.url, "_blank"); // Comentado para que no abra nueva pestaña
})
    
    })
    .catch(err => {
      console.error(err);
      alert("❌ Error al publicar. Revisa si el token expiró o si el Blog ID es correcto.");
    });
});
