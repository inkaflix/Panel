const blogIdInput = document.getElementById("blogId");

document.getElementById("publishPost").addEventListener("click", (e) => {
  e.preventDefault(); // Evita recargar o redirigir la página

  const blogId = blogIdInput.value.trim() || "3812927193244872888";
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
      // No abre pestaña ni redirige
    })
    .catch(err => {
      console.error(err);
      alert("❌ Error al publicar. Revisa si el token expiró o si el Blog ID es correcto.");
    });
});
