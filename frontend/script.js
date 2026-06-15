const form = document.getElementById("uploadForm");
const statusText = document.getElementById("status");
const downloadLink = document.getElementById("downloadLink");
const videoContainer = document.getElementById("videoContainer");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    statusText.innerText = "Uploading video...";

    const formData = new FormData(form);

    try {
        const response = await fetch("http://127.0.0.1:5000/upload", {
            method: "POST",
            body: formData
        });

        const data = await response.json();
        const videoId = data.videoId;

        statusText.innerText = "Uploaded. Processing started...";

        const interval = setInterval(async () => {
            const res = await fetch(`http://127.0.0.1:5000/status/${videoId}`);
            const statusData = await res.json();

            statusText.innerText = "Status: " + statusData.status;

            if (statusData.status === "completed") {
                clearInterval(interval);

                const videoUrl =
                    `http://127.0.0.1:5000/uploads/${statusData.processedVideo}`;

                statusText.innerText = "Processing complete ✔";

                // ✅ Download link
                downloadLink.href = videoUrl;
                downloadLink.innerText = "Download Video";
                downloadLink.target = "_blank";

                // ✅ Video preview
                videoContainer.innerHTML = `
                    <video width="600" controls>
                        <source src="${videoUrl}" type="video/mp4">
                        Your browser does not support video tag.
                    </video>
                `;
            }
        }, 2000);

    } catch (error) {
        statusText.innerText = "Upload failed";
        console.log(error);
    }
});