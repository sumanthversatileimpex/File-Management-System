const SUPABASE_URL = "https://loijlfuaqpgzdodtfdgi.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvaWpsZnVhcXBnemRvZHRmZGdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4MDM0OTgsImV4cCI6MjA1NzM3OTQ5OH0.9bit3gbjIPsiayzu3AEOWVfHAsEbxKiQ9r_rnpvW-60"; 

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const fileInput = document.getElementById("file-input");
const fileForm = document.getElementById("file-form");
const fileTableBody = document.getElementById("file-table-body");
const fileNameDisplay = document.getElementById("file-name");

fileInput.addEventListener("change", () => {
    fileNameDisplay.textContent = fileInput.files.length > 0 ? fileInput.files[0].name : "No file chosen";
});

function showToast(message, type = "success") {
    const toastContainer = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function showConfirmToast(message, onConfirm) {
    const toastContainer = document.getElementById("toast-container");

    const toast = document.createElement("div");
    toast.className = "toast confirm";
    toast.innerHTML = `
        <span>${message}</span>
        <div>
            <button class="confirm-btn">Yes</button>
            <button class="cancel-btn">No</button>
        </div>
    `;

    toastContainer.appendChild(toast);

    toast.querySelector(".confirm-btn").addEventListener("click", () => {
        onConfirm();
        toast.remove();
    });

    toast.querySelector(".cancel-btn").addEventListener("click", () => {
        toast.remove();
    });

    setTimeout(() => {
        toast.remove();
    }, 5000);
}

async function deleteFile(fileName, fileId) {
    showConfirmToast("Are you sure you want to delete this file?", async () => {
        const { error: storageError } = await supabase.storage.from("pdf-storage").remove([fileName]);

        if (storageError) {
            showToast("Error deleting file from storage!", "error");
            return;
        }

        const { error: dbError } = await supabase.from("pdf_table").delete().match({ id: fileId });

        if (dbError) {
            showToast("Error deleting file from database!", "error");
            return;
        }

        showToast("File deleted successfully!", "success");
        fetchFiles();
    });
}

fileForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const file = fileInput.files[0];
    if (!file || !file.name.endsWith(".pdf")) {
        showToast("Error uploading file!", "error");
        // alert("Please select a valid PDF file.");
        return;
    }

    const fileName = file.name; 

    const { data, error } = await supabase.storage.from("pdf-storage").upload(fileName, file, { upsert: true });

    if (error) {
        console.error("Upload error:", error);
        showToast("Error uploading file!", "error");
        // alert("Error uploading file!");
        return;
    }

    const { data: urlData } = supabase.storage.from("pdf-storage").getPublicUrl(fileName);
    const fileUrl = urlData.publicUrl;

    const { error: insertError } = await supabase.from("pdf_table").insert([{ file_name: fileName, file_url: fileUrl }]);

    if (insertError) {
        showToast("Error uploading file!", "error");
        // console.error("Database insert error:", insertError);
        // alert("Error saving file info!");
        return;
    }
    showToast("File uploaded successfully!", "success");

    // alert("File uploaded successfully!");
    fileInput.value = ""; // Clear input field
    fileNameDisplay.textContent = "No file chosen";
    fetchFiles(); 
});


async function fetchFiles() {
    const { data, error } = await supabase.from("pdf_table").select("*");

    if (error) {
        console.error("Fetch error:", error);
        return;
    }

    fileTableBody.innerHTML = "";

    data.forEach((file) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${file.file_name}</td>
             <td><button class="view-button" onclick="window.open('${file.file_url}', '_blank')">View PDF</button></td>
            <td><button  class="delete-button" onclick="deleteFile('${file.file_name}', ${file.id})">Delete</button></td>
        `;

        fileTableBody.appendChild(row);
    });
}

async function deleteFile(fileName, fileId) {
    showConfirmToast("Are you sure you want to delete this file?", async () => {
        const { error: storageError } = await supabase.storage.from("pdf-storage").remove([fileName]);

        if (storageError) {
            showToast("Error deleting file from storage!", "error");
            return;
        }

        const { error: dbError } = await supabase.from("pdf_table").delete().match({ id: fileId });

        if (dbError) {
            showToast("Error deleting file from database!", "error");
            return;
        }

        showToast("File deleted successfully!", "success");
        fetchFiles();
    });
}

fetchFiles();