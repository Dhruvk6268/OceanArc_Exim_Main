document.addEventListener("DOMContentLoaded", function () {
  checkAdminAuth();
  setupTabs();
  setupEventListeners();
  loadInquiries();
  loadBlogPosts();
  loadProducts();
});

/* ---------------- HELPER FUNCTIONS ---------------- */
function formatDateDDMMYYYY(dateString) {
  if (!dateString) return "N/A";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (e) {
    console.error("Date formatting error:", e);
    return "Invalid Date";
  }
}

function formatDateTime(dateString) {
  if (!dateString) return "N/A";
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  } catch (e) {
    console.error("DateTime formatting error:", e);
    return "Invalid Date";
  }
}

// Helper function to generate slug from title
function generateSlug(title) {
  return String(title || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Remove duplicate hyphens
    .replace(/^-+|-+$/g, ""); // Trim hyphens on both ends
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[char];
  });
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/\r?\n/g, " ");
}

function safeMediaPath(path) {
  const value = String(path || "").trim();
  if (!value) return "";

  if (/^(https?:\/\/|uploads\/|images\/|videos\/)/i.test(value)) {
    return value;
  }

  if (/^\//.test(value)) {
    return value;
  }

  return "";
}

/* ---------------- AUTH ---------------- */
function checkAdminAuth() {
  fetch("php/check-auth.php")
    .then((r) => r.json())
    .then((data) => {
      if (!data.authenticated) {
        window.location.href = "admin-login.html";
      }
    })
    .catch(() => {
      window.location.href = "admin-login.html";
    });
}

function logoutAdmin() {
  fetch("php/logout.php")
    .then((r) => r.json())
    .then((data) => {
      if (data.success) {
        window.location.href = "admin-login.html";
      }
    })
    .catch((err) => console.error("Logout error:", err));
}

/* ---------------- TABS ---------------- */
const ADMIN_TAB_STORAGE_KEY = "oceanarc_admin_active_tab";

function activateAdminTab(tabName) {
  const targetTab = document.querySelector(`.admin-tab[data-tab="${tabName}"]`);
  const targetContent = document.getElementById(`${tabName}-tab`);

  if (!targetTab || !targetContent) {
    return false;
  }

  document
    .querySelectorAll(".admin-tab, .tab-content")
    .forEach((el) => el.classList.remove("active"));

  targetTab.classList.add("active");
  targetContent.classList.add("active");

  try {
    localStorage.setItem(ADMIN_TAB_STORAGE_KEY, tabName);
  } catch (err) {
    console.warn("Unable to persist active admin tab:", err);
  }

  if (tabName === "uploads") {
    loadUploads();
  }

  return true;
}

function setupTabs() {
  const tabs = Array.from(document.querySelectorAll(".admin-tab"));
  if (!tabs.length) {
    return;
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      activateAdminTab(this.dataset.tab);
    });
  });

  let savedTabName = "";
  try {
    savedTabName = localStorage.getItem(ADMIN_TAB_STORAGE_KEY) || "";
  } catch (err) {
    console.warn("Unable to read saved admin tab:", err);
  }

  const defaultTabName =
    document.querySelector(".admin-tab.active")?.dataset.tab || tabs[0].dataset.tab;

  if (!activateAdminTab(savedTabName)) {
    activateAdminTab(defaultTabName);
  }
}

/* ---------------- EVENT LISTENERS ---------------- */
function setupEventListeners() {
  document.getElementById("logoutBtn").addEventListener("click", (e) => {
    e.preventDefault();
    logoutAdmin();
  });

  document.getElementById("addPostBtn").addEventListener("click", () => {
    const formContainer = document.getElementById("postForm");
    const formElement = document.getElementById("blogPostForm");
    formElement.reset();
    formContainer.style.display = "block";
    document.getElementById("formTitle").textContent = "Add New Blog Post";
    document.getElementById("postId").value = "";
    document.getElementById("postImage").dataset.existingImage = "";
    document.getElementById("imagePreview").style.display = "none";
    
    // Hide any inline edit forms
    document.querySelectorAll('.inline-edit-form').forEach(form => {
      form.style.display = 'none';
      form.classList.remove('active');
    });
  });

  document.getElementById("addProductBtn").addEventListener("click", () => {
    const formContainer = document.getElementById("productForm");
    const formElement = document.getElementById("productPostForm");
    formElement.reset();
    formContainer.style.display = "block";
    document.getElementById("productFormTitle").textContent = "Add New Product";
    document.getElementById("productId").value = "";
    document.getElementById("productImage").dataset.existingImage = "";
    document.getElementById("productImagePreview").style.display = "none";
    document.getElementById("productVideo").dataset.existingVideo = "";
    document.getElementById("productVideoPreview").style.display = "none";
    
    // Hide any inline edit forms
    document.querySelectorAll('.inline-edit-form').forEach(form => {
      form.style.display = 'none';
      form.classList.remove('active');
    });
  });

  document.getElementById("cancelBtn").addEventListener("click", () => {
    document.getElementById("postForm").style.display = "none";
  });

  document.getElementById("cancelProductBtn").addEventListener("click", () => {
    document.getElementById("productForm").style.display = "none";
  });

  // Auto-generate slug from title (Blog)
  document.getElementById("postTitle").addEventListener("input", function() {
    const title = this.value.trim();
    const slugInput = document.getElementById("postSlug");
    const postId = document.getElementById("postId").value;
    
    // Only auto-generate if it's a new post (no ID) or slug is empty
    if ((!postId || slugInput.value === '') && title) {
      slugInput.value = generateSlug(title);
    }
  });

  // Auto-generate slug from title (Product) - ADDED
  document.getElementById("productTitle").addEventListener("input", function() {
    const title = this.value.trim();
    const slugInput = document.getElementById("productSlug");
    const productId = document.getElementById("productId").value;
    
    // Only auto-generate if it's a new product (no ID) or slug is empty
    if ((!productId || slugInput.value === '') && title) {
      slugInput.value = generateSlug(title);
    }
  });

  document.getElementById("postImage").addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      document.getElementById("previewImage").src = event.target.result;
      document.getElementById("imagePreview").style.display = "block";
    };
    reader.readAsDataURL(file);
  });

  document
    .getElementById("productImage")
    .addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        document.getElementById("previewProductImage").src =
          event.target.result;
        document.getElementById("productImagePreview").style.display = "block";
      };
      reader.readAsDataURL(file);
    });

  document
    .getElementById("productVideo")
    .addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (!file) return;
      
      // Check file size client-side (50MB limit)
      const maxSize = 50 * 1024 * 1024; // 50MB in bytes
      if (file.size > maxSize) {
        alert(`Video file is too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maximum 50MB allowed.`);
        this.value = ''; // Clear the file input
        return;
      }
      
      // Check file type
      const allowedTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv', 'video/webm'];
      if (!allowedTypes.includes(file.type)) {
        alert('Invalid file type. Please select a valid video file (MP4, MOV, AVI, WMV, WEBM).');
        this.value = ''; // Clear the file input
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        document.getElementById("previewProductVideo").src = event.target.result;
        document.getElementById("productVideoPreview").style.display = "block";
      };
      reader.readAsDataURL(file);
    });

  document
    .getElementById("deleteImageBtn")
    .addEventListener("click", async () => {
      const existingImage =
        document.getElementById("postImage").dataset.existingImage;
      const postId = document.getElementById("postId").value;

      if (!existingImage) {
        alert("No image to delete.");
        return;
      }

      if (!confirm("Are you sure you want to delete this image?")) return;

      try {
        const res = await fetch("php/delete-file.php", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `filePath=${encodeURIComponent(
            existingImage
          )}&postId=${encodeURIComponent(postId)}`,
        });
        const data = await res.json();
        if (data.success) {
          alert("Image deleted successfully.");
          document.getElementById("previewImage").src = "";
          document.getElementById("imagePreview").style.display = "none";
          document.getElementById("postImage").dataset.existingImage = "";
        } else {
          alert(data.error || "Failed to delete image.");
        }
      } catch (err) {
        console.error("Delete image error:", err);
        alert("Error deleting image.");
      }
    });

  document
    .getElementById("deleteProductImageBtn")
    .addEventListener("click", async () => {
      const existingImage =
        document.getElementById("productImage").dataset.existingImage;
      const productId = document.getElementById("productId").value;

      if (!existingImage) {
        alert("No image to delete.");
        return;
      }

      if (!confirm("Are you sure you want to delete this image?")) return;

      try {
        const res = await fetch("php/delete-file.php", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `filePath=${encodeURIComponent(
            existingImage
          )}&productId=${encodeURIComponent(productId)}`,
        });
        const data = await res.json();
        if (data.success) {
          alert("Image deleted successfully.");
          document.getElementById("previewProductImage").src = "";
          document.getElementById("productImagePreview").style.display = "none";
          document.getElementById("productImage").dataset.existingImage = "";
        } else {
          alert(data.error || "Failed to delete image.");
        }
      } catch (err) {
        console.error("Delete image error:", err);
        alert("Error deleting image.");
      }
    });

  document
    .getElementById("deleteProductVideoBtn")
    .addEventListener("click", async () => {
      const existingVideo =
        document.getElementById("productVideo").dataset.existingVideo;
      const productId = document.getElementById("productId").value;

      if (!existingVideo) {
        alert("No video to delete.");
        return;
      }

      if (!confirm("Are you sure you want to delete this video?")) return;

      try {
        const res = await fetch("php/delete-file.php", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `filePath=${encodeURIComponent(
            existingVideo
          )}&productId=${encodeURIComponent(productId)}`,
        });
        const data = await res.json();
        if (data.success) {
          alert("Video deleted successfully.");
          document.getElementById("previewProductVideo").src = "";
          document.getElementById("productVideoPreview").style.display = "none";
          document.getElementById("productVideo").dataset.existingVideo = "";
        } else {
          alert(data.error || "Failed to delete video.");
        }
      } catch (err) {
        console.error("Delete video error:", err);
        alert("Error deleting video.");
      }
    });

  document
    .getElementById("blogPostForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();
      await saveBlogPost();
    });

  document
    .getElementById("productPostForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();
      await saveProduct();
    });

  document
    .getElementById("downloadInquiriesBtn")
    .addEventListener("click", () => {
      const start = document.getElementById("startDate").value;
      const end = document.getElementById("endDate").value;
      const status = document.getElementById("statusFilter").value;

      let url = `php/download-inquiries.php?`;
      if (start) url += `start=${encodeURIComponent(start)}&`;
      if (end) url += `end=${encodeURIComponent(end)}&`;
      if (status) url += `status=${encodeURIComponent(status)}&`;

      window.open(url, "_blank");
    });

  // Uploads tab
  const uploadBtn = document.getElementById("uploadNewFileBtn");
  if (uploadBtn) {
    uploadBtn.addEventListener("click", () => {
      const fileInput = document.getElementById("newUploadFile");
      const file = fileInput.files[0];
      if (!file) return alert("Please select a file");
      const formData = new FormData();
      formData.append("file", file);
      fetch("php/upload-file.php", { method: "POST", body: formData })
        .then((r) => r.json())
        .then((res) => {
          if (res.success) {
            alert("File uploaded");
            fileInput.value = "";
            loadUploads();
          } else {
            alert(res.error);
          }
        });
    });
  }

  // Quick filter event listeners
  document.getElementById("quickDateFilter").addEventListener("change", function() {
    const filter = this.value;
    const status = document.getElementById("quickStatusFilter").value;
    
    if (filter === "custom") {
      document.getElementById("quickStartDate").style.display = "inline-block";
      document.getElementById("quickEndDate").style.display = "inline-block";
      document.getElementById("applyQuickDate").style.display = "inline-block";
      
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      document.getElementById("quickStartDate").value = yesterdayStr;
      document.getElementById("quickEndDate").value = today;
    } else {
      document.getElementById("quickStartDate").style.display = "none";
      document.getElementById("quickEndDate").style.display = "none";
      document.getElementById("applyQuickDate").style.display = "none";
      loadInquiries(filter, "", "", status);
    }
  });

  document.getElementById("quickStatusFilter").addEventListener("change", function() {
    const filter = document.getElementById("quickDateFilter").value;
    const status = this.value;
    if (filter === "custom") return;
    loadInquiries(filter, "", "", status);
  });

  document.getElementById("applyQuickDate").addEventListener("click", function() {
    const start = document.getElementById("quickStartDate").value;
    const end = document.getElementById("quickEndDate").value;
    const status = document.getElementById("quickStatusFilter").value;
    
    if (!start || !end) {
      alert("Please select both start and end dates");
      return;
    }
    
    if (new Date(start) > new Date(end)) {
      alert("Start date cannot be after end date");
      return;
    }
    
    loadInquiries("custom", start, end, status);
  });
}

/* ---------------- INQUIRIES ---------------- */
function loadInquiries(filter = "", start = "", end = "", status = "") {
  const tbody = document.querySelector("#inquiries-table tbody");
  tbody.innerHTML = "<tr><td colspan='10' style='text-align:center;padding:20px;'>Loading inquiries...</td></tr>";

  let url = `php/get-inquiries.php?filter=${filter}&status=${status}`;
  if (filter === "custom") {
    url += `&start=${start}&end=${end}`;
  }

  fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error('Network response was not ok');
      return r.json();
    })
    .then((data) => {
      if (data.message) {
        tbody.innerHTML = `<tr><td colspan='10' style='text-align:center;padding:20px;'>${escapeHtml(data.message)}</td></tr>`;
        return;
      }

      if (!Array.isArray(data)) {
        const errorMessage = escapeHtml(data?.error || "Unexpected response format");
        tbody.innerHTML = `<tr><td colspan='10' style='text-align:center;padding:20px;color:red;'>${errorMessage}</td></tr>`;
        return;
      }

      tbody.innerHTML = "";

      data.forEach((inquiry) => {
        const safeName = escapeHtml(inquiry.name);
        const safeCompany = escapeHtml(inquiry.company);
        const safeEmail = escapeHtml(inquiry.email);
        const safePhone = escapeHtml(inquiry.phone);
        const safeCountry = escapeHtml(inquiry.country || "N/A");
        const inquiryId = Number(inquiry.id) || 0;

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${inquiryId}</td>
          <td>${safeName}</td>
          <td>${safeCompany}</td>
          <td>${safeEmail}</td>
          <td>${safePhone}</td>
          <td>${safeCountry}</td>
          <td>
            <select class="status-select" data-id="${inquiryId}">
              <option value="new" ${inquiry.status === "new" ? "selected" : ""}>New</option>
              <option value="in_progress" ${inquiry.status === "in_progress" ? "selected" : ""}>In Progress</option>
              <option value="resolved" ${inquiry.status === "resolved" ? "selected" : ""}>Resolved</option>
            </select>
          </td>
          <td>
            <select class="assignee-select" data-id="${inquiryId}">
              <option value="">Unassigned</option>
              <option value="Dhruv Navdiya" ${inquiry.assigned_to === "Dhruv Navdiya" ? "selected" : ""}>Dhruv Navdiya</option>
              <option value="Dhruv Khokhar" ${inquiry.assigned_to === "Dhruv Khokhar" ? "selected" : ""}>Dhruv Khokhar</option>
              <option value="Om Navdiya" ${inquiry.assigned_to === "Om Navdiya" ? "selected" : ""}>Om Navdiya</option>
            </select>
          </td>
          <td>${formatDateDDMMYYYY(inquiry.created_at)}</td>
          <td>
            <button class="action-btn view-btn" data-id="${inquiryId}">View</button>
            <button class="action-btn delete-inquiry" data-id="${inquiryId}">Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      attachInquiryEventHandlers();
    })
    .catch((err) => {
      console.error("Error loading inquiries:", err);
      tbody.innerHTML = `<tr><td colspan='10' style='text-align:center;padding:20px;color:red;'>Error loading inquiries: ${escapeHtml(err.message)}</td></tr>`;
    });
}

function attachInquiryEventHandlers() {
  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.addEventListener("click", () => viewInquiry(btn.dataset.id));
  });

  document.querySelectorAll(".status-select").forEach((select) => {
    select.addEventListener("change", () =>
      updateInquiryStatus(select.dataset.id, select.value)
    );
  });

  document.querySelectorAll(".assignee-select").forEach((select) => {
    select.addEventListener("change", () =>
      updateInquiryAssignee(select.dataset.id, select.value)
    );
  });

  document.querySelectorAll(".notes-btn").forEach((btn) => {
    btn.addEventListener("click", () => toggleNotesSection(btn.dataset.id));
  });

  document.querySelectorAll(".delete-inquiry").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!confirm("Are you sure you want to delete this inquiry?")) return;

      fetch("php/delete-inquiry.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "id=" + encodeURIComponent(btn.dataset.id),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            alert("Inquiry deleted successfully");
            refreshCurrentFilters();
          } else {
            alert("Error: " + (data.error || "Failed to delete"));
          }
        });
    });
  });
}

function toggleNotesSection(id) {
  const notesSection = document.getElementById(`notes-${id}`);
  if (!notesSection) return;
  notesSection.style.display =
    notesSection.style.display === "none" || !notesSection.style.display
      ? "block"
      : "none";
}

function refreshCurrentFilters() {
  const filter = document.getElementById("quickDateFilter").value;
  const status = document.getElementById("quickStatusFilter").value;
  let start = "", end = "";

  if (filter === "custom") {
    start = document.getElementById("quickStartDate").value;
    end = document.getElementById("quickEndDate").value;
  }

  loadInquiries(filter, start, end, status);
}

/* ---------------- INQUIRY ASSIGNEE ---------------- */
async function updateInquiryAssignee(id, assignee) {
  try {
    const res = await fetch("php/update-inquiry-assignee.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `id=${encodeURIComponent(id)}&assignee=${encodeURIComponent(assignee)}`,
    });
    const data = await res.json();
    if (!data.success) alert("Error updating assignee");
  } catch (err) {
    console.error("Error updating assignee:", err);
    alert("Error updating assignee");
  }
}
 
/* ---------------- VIEW INQUIRY ---------------- */
function viewInquiry(id) {
  fetch(`php/get-inquiry.php?id=${encodeURIComponent(id)}`)
    .then((r) => r.json())
    .then((inquiry) => {
      alert(
        `Inquiry Details:\n\nName: ${inquiry.name}\nCompany: ${
          inquiry.company
        }\nEmail: ${inquiry.email}\nPhone: ${inquiry.phone}\nCountry: ${
          inquiry.country
        }\nStatus: ${inquiry.status}\nAssignee: ${inquiry.assigned_to || 'None'}\nMessage: ${
          inquiry.message
        }\nDate: ${formatDateDDMMYYYY(inquiry.created_at)}`
      );
    })
    .catch(() => alert("Error loading inquiry details"));
}

function updateInquiryStatus(id, status) {
  fetch("php/update-inquiry.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `id=${encodeURIComponent(id)}&status=${encodeURIComponent(status)}`,
  })
    .then((r) => r.json())
    .then((data) => {
      if (!data.success) alert("Error updating status");
    })
    .catch(() => alert("Error updating status"));
}

/* ---------------- BLOG POSTS ---------------- */
function loadBlogPosts() {
  fetch("php/get-blog-posts.php")
    .then((r) => r.json())
    .then((posts) => {
      const tbody = document.querySelector("#blog-posts-table tbody");
      tbody.innerHTML = "";
      posts.forEach((post) => {
        const postId = Number(post.id) || 0;
        const safeTitle = escapeHtml(post.title);
        const safeSlug = escapeHtml(post.slug || "N/A");
        const safeExcerpt = escapeHtml(post.excerpt || "N/A");
        const safeFormTitle = escapeAttr(post.title || "");
        const safeFormSlug = escapeAttr(post.slug || "");
        const safeFormExcerpt = escapeHtml(post.excerpt || "");
        const safeFormContent = escapeHtml(post.content || "");
        const safePostImage = safeMediaPath(post.image);
        const safePostImageAttr = escapeAttr(safePostImage);

        const tr = document.createElement("tr");
        tr.classList.add('blog-post-row');
        tr.innerHTML = `
          <td>${postId}</td>
          <td>${safeTitle}</td>
          <td>${safeSlug}</td>
          <td>${safeExcerpt}</td>
          <td>${formatDateDDMMYYYY(post.created_at)}</td>
          <td>
            <button class="action-btn edit-btn edit-blog-btn" data-id="${postId}">Edit</button>
            <button class="action-btn delete-btn delete-blog-btn" data-id="${postId}">Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
        
        // Create inline edit form
        const inlineForm = document.createElement("tr");
        inlineForm.classList.add('inline-edit-row');
        inlineForm.innerHTML = `
          <td colspan="6">
            <div class="inline-edit-form" id="blog-edit-form-${postId}">
              <h3>Edit Blog Post: ${safeTitle}</h3>
              <form class="inline-blog-form" data-id="${postId}">
                <input type="hidden" name="id" value="${postId}">
                 
                <div class="form-group">
                  <label for="blog-title-${postId}">Title:</label>
                  <input type="text" id="blog-title-${postId}" name="title" value="${safeFormTitle}" required>
                </div>
                 
                <div class="form-group">
                  <label for="blog-slug-${postId}">Slug (URL-friendly):</label>
                  <input type="text" id="blog-slug-${postId}" name="slug" value="${safeFormSlug}" required>
                  <small style="color: #666; font-size: 0.9em;">Used in the URL: https://oceanarcexim.com/blog-single.html?slug=your-slug-here</small>
                </div>
                 
                <div class="form-group">
                  <label for="blog-excerpt-${postId}">Excerpt:</label>
                  <textarea id="blog-excerpt-${postId}" name="excerpt">${safeFormExcerpt}</textarea>
                </div>
                 
                <div class="form-group">
                  <label for="blog-content-${postId}">Content:</label>
                  <textarea id="blog-content-${postId}" name="content" rows="6" required>${safeFormContent}</textarea>
                </div>
                 
                <div class="form-group">
                  <label for="blog-image-${postId}">Image:</label>
                  <input type="file" id="blog-image-${postId}" name="image" accept="image/*" class="inline-image-input" data-existing-image="${safePostImageAttr}">
                  ${safePostImage ? `
                  <div class="image-preview-container" style="margin-top: 10px;">
                    <img src="${safePostImageAttr}" alt="Current Image" style="max-width: 200px; display: block; margin-bottom: 10px;">
                    <button type="button" class="action-btn delete-btn delete-inline-image-btn" data-id="${postId}">Delete Image</button>
                  </div>
                  ` : ''}
                </div>
                 
                <div class="inline-form-buttons">
                  <button type="submit" class="action-btn save-btn">Save Changes</button>
                  <button type="button" class="action-btn cancel-btn cancel-inline-edit" data-id="${postId}">Cancel</button>
                </div>
              </form>
            </div>
          </td>
        `;
        tbody.appendChild(inlineForm);
      });

      // Attach event handlers
      document.querySelectorAll(".edit-blog-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          toggleInlineBlogForm(btn.dataset.id);
        });
      });

      document.querySelectorAll(".delete-blog-btn").forEach((btn) => {
        btn.addEventListener("click", () => deleteBlogPost(btn.dataset.id));
      });

      // Handle inline form submissions
      document.querySelectorAll(".inline-blog-form").forEach((form) => {
        form.addEventListener("submit", async (e) => {
          e.preventDefault();
          await saveInlineBlogPost(form);
        });
      });

      // Handle cancel buttons
      document.querySelectorAll(".cancel-inline-edit").forEach((btn) => {
        btn.addEventListener("click", () => {
          const form = document.getElementById(`blog-edit-form-${btn.dataset.id}`);
          form.style.display = 'none';
          form.classList.remove('active');
        });
      });

      // Handle inline image deletion
      document.querySelectorAll(".delete-inline-image-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const postId = btn.dataset.id;
          const form = btn.closest('.inline-blog-form');
          const imageInput = form.querySelector('.inline-image-input');
          const existingImage = imageInput.dataset.existingImage;
          
          if (!confirm("Are you sure you want to delete this image?")) return;
          
          try {
            const res = await fetch("php/delete-file.php", {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: `filePath=${encodeURIComponent(existingImage)}&postId=${encodeURIComponent(postId)}`,
            });
            const data = await res.json();
            if (data.success) {
              alert("Image deleted successfully.");
              imageInput.dataset.existingImage = "";
              const previewContainer = btn.closest('.image-preview-container');
              if (previewContainer) {
                previewContainer.remove();
              }
            } else {
              alert(data.error || "Failed to delete image.");
            }
          } catch (err) {
            console.error("Delete image error:", err);
            alert("Error deleting image.");
          }
        });
      });
    })
    .catch((err) => console.error("Error loading posts:", err));
}

function toggleInlineBlogForm(postId) {
  // Hide any other open inline forms
  document.querySelectorAll('.inline-edit-form').forEach(form => {
    form.style.display = 'none';
    form.classList.remove('active');
  });
  
  // Show the clicked form
  const form = document.getElementById(`blog-edit-form-${postId}`);
  if (form) {
    form.style.display = 'block';
    form.classList.add('active');
    
    // Scroll to the form if needed
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

async function saveInlineBlogPost(form) {
  const formData = new FormData(form);
  const postId = formData.get('id');
  
  // Handle image upload if a new file is selected
  const imageInput = form.querySelector('.inline-image-input');
  const imageFile = imageInput.files[0];
  
  if (imageFile) {
    const uploadData = new FormData();
    uploadData.append("image_file", imageFile);
    
    try {
      const uploadRes = await fetch("php/upload-image.php", {
        method: "POST",
        body: uploadData,
      });
      const uploadJson = await uploadRes.json();
      if (!uploadJson.success) {
        alert(uploadJson.error || "Image upload failed");
        return;
      }
      formData.set("image", uploadJson.imagePath);
    } catch (err) {
      console.error("Image upload error:", err);
      alert("Error uploading image");
      return;
    }
  } else {
    // Use existing image if no new file
    formData.set("image", imageInput.dataset.existingImage || "");
  }
  
  // Send the data
  try {
    const saveRes = await fetch("php/save-blog-post.php", {
      method: "POST",
      body: formData,
    });
    
    const saveText = await saveRes.text();
    let saveJson;
    try {
      saveJson = JSON.parse(saveText);
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr);
      alert("Server returned invalid JSON");
      return;
    }
    
    if (saveJson.success) {
      alert("Post updated successfully");
      loadBlogPosts(); // Reload to refresh the list
    } else {
      alert(saveJson.error || "Error updating post");
    }
  } catch (err) {
    console.error("Save error:", err);
    alert("Unexpected error occurred");
  }
}

// Old editBlogPost function (kept for reference but not used with inline forms)
function editBlogPost(id) {
  // This is now handled by toggleInlineBlogForm
  toggleInlineBlogForm(id);
}

async function saveBlogPost() {
  const id = document.getElementById("postId").value;
  const title = document.getElementById("postTitle").value.trim();
  const slug = document.getElementById("postSlug").value.trim();
  const excerpt = document.getElementById("postExcerpt").value.trim();
  const content = document.getElementById("postContent").value.trim();
  const imageInput = document.getElementById("postImage");

  if (!title || !content) {
    alert("Title and content are required");
    return;
  }

  if (!slug) {
    alert("Slug is required for SEO-friendly URLs");
    return;
  }

  try {
    let finalImagePath = imageInput.dataset.existingImage || "";
    const file = imageInput.files[0];
    if (file) {
      const uploadData = new FormData();
      uploadData.append("image_file", file);
      const uploadRes = await fetch("php/upload-image.php", {
        method: "POST",
        body: uploadData,
      });
      const uploadJson = await uploadRes.json();
      if (!uploadJson.success) {
        alert(uploadJson.error || "Image upload failed");
        return;
      }
      finalImagePath = uploadJson.imagePath;
    }

    const formData = new FormData();
    formData.append("id", id);
    formData.append("title", title);
    formData.append("slug", slug);
    formData.append("excerpt", excerpt);
    formData.append("image", finalImagePath);
    formData.append("content", content);

    const saveRes = await fetch("php/save-blog-post.php", {
      method: "POST",
      body: formData,
    });
    const rawText = await saveRes.text();
    console.log("Raw save-blog-post.php response:", rawText);

    let saveJson;
    try {
      saveJson = JSON.parse(rawText);
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr);
      alert("Server did not return valid JSON. Check console for details.");
      return;
    }

    if (saveJson.success) {
      alert("Post saved successfully");
      document.getElementById("postForm").style.display = "none";
      loadBlogPosts();
    } else {
      alert(saveJson.error || "Error saving post");
    }
  } catch (err) {
    console.error("Save error:", err);
    alert("Unexpected error occurred");
  }
}

function deleteBlogPost(id) {
  if (!confirm("Delete this post?")) return;
  fetch("php/delete-blog-post.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `id=${encodeURIComponent(id)}`,
  })
    .then((r) => r.json())
    .then((data) => {
      if (data.success) {
        alert("Post deleted");
        loadBlogPosts();
      } else {
        alert("Error deleting post");
      }
    })
    .catch(() => alert("Error deleting post"));
}

/* ---------------- PRODUCTS ---------------- */
function loadProducts() {
  fetch("php/get-products.php")
    .then((r) => r.json())
    .then((products) => {
      const tbody = document.querySelector("#products-table tbody");
      tbody.innerHTML = "";
      products.forEach((product) => {
        const productId = Number(product.id) || 0;
        const safeTitle = escapeHtml(product.title);
        const safeSlug = escapeHtml(product.slug || "N/A");
        const safeCategory = escapeHtml(product.category || "N/A");
        const safeFormTitle = escapeAttr(product.title || "");
        const safeFormSlug = escapeAttr(product.slug || "");
        const safeFormCategory = escapeAttr(product.category || "");
        const safeFormDescription = escapeHtml(product.description || "");
        const safeFormSpecifications = escapeHtml(product.specifications || "");
        const safeFormContent = escapeHtml(product.content || "");
        const safeProductImage = safeMediaPath(product.image);
        const safeProductVideo = safeMediaPath(product.video);
        const safeProductImageAttr = escapeAttr(safeProductImage);
        const safeProductVideoAttr = escapeAttr(safeProductVideo);

        const tr = document.createElement("tr");
        tr.classList.add('product-row');
        tr.innerHTML = `
          <td>${productId}</td>
          <td>${safeTitle}</td>
          <td>${safeSlug}</td>
          <td>${safeCategory}</td>
          <td>${formatDateDDMMYYYY(product.created_at)}</td>
          <td>
            <button class="action-btn edit-btn edit-product-btn" data-id="${productId}">Edit</button>
            <button class="action-btn delete-btn delete-product-btn" data-id="${productId}">Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
        
        // Create inline edit form WITH SLUG FIELD
        const inlineForm = document.createElement("tr");
        inlineForm.classList.add('inline-edit-row');
        inlineForm.innerHTML = `
          <td colspan="6">
            <div class="inline-edit-form" id="product-edit-form-${productId}">
              <h3>Edit Product: ${safeTitle}</h3>
              <form class="inline-product-form" data-id="${productId}">
                <input type="hidden" name="id" value="${productId}">
                 
                <div class="form-group">
                  <label for="product-title-${productId}">Title:</label>
                  <input type="text" id="product-title-${productId}" name="title" value="${safeFormTitle}" required>
                </div>
                 
                <div class="form-group">
                  <label for="product-slug-${productId}">Slug (URL-friendly):</label>
                  <input type="text" id="product-slug-${productId}" name="slug" value="${safeFormSlug}" required>
                  <small style="color: #666; font-size: 0.9em;">Used in the URL: https://oceanarcexim.com/agro-single.html?slug=your-slug-here</small>
                </div>
                 
                <div class="form-group">
                  <label for="product-category-${productId}">Category:</label>
                  <input type="text" id="product-category-${productId}" name="category" value="${safeFormCategory}">
                </div>
                 
                <div class="form-group">
                  <label for="product-description-${productId}">Short Description:</label>
                  <textarea id="product-description-${productId}" name="description">${safeFormDescription}</textarea>
                </div>
                 
                <div class="form-group">
                  <label for="product-specs-${productId}">Specifications (one per line):</label>
                  <textarea id="product-specs-${productId}" name="specifications">${safeFormSpecifications}</textarea>
                </div>
                 
                <div class="form-group">
                  <label for="product-content-${productId}">Detailed Content:</label>
                  <textarea id="product-content-${productId}" name="content" rows="6" required>${safeFormContent}</textarea>
                </div>
                 
                <div class="form-group">
                  <label for="product-image-${productId}">Image:</label>
                  <input type="file" id="product-image-${productId}" name="image" accept="image/*" class="inline-product-image-input" data-existing-image="${safeProductImageAttr}">
                  ${safeProductImage ? `
                  <div class="image-preview-container" style="margin-top: 10px;">
                    <img src="${safeProductImageAttr}" alt="Current Image" style="max-width: 200px; display: block; margin-bottom: 10px;">
                    <button type="button" class="action-btn delete-btn delete-inline-product-image-btn" data-id="${productId}">Delete Image</button>
                  </div>
                  ` : ''}
                </div>
                 
                <div class="form-group">
                  <label for="product-video-${productId}">Video:</label>
                  <input type="file" id="product-video-${productId}" name="video" accept="video/*" class="inline-product-video-input" data-existing-video="${safeProductVideoAttr}">
                  ${safeProductVideo ? `
                  <div class="video-preview-container" style="margin-top: 10px;">
                    <video src="${safeProductVideoAttr}" controls style="max-width: 300px; display: block; margin-bottom: 10px;"></video>
                    <button type="button" class="action-btn delete-btn delete-inline-product-video-btn" data-id="${productId}">Delete Video</button>
                  </div>
                  ` : ''}
                </div>
                 
                <div class="inline-form-buttons">
                  <button type="submit" class="action-btn save-btn">Save Changes</button>
                  <button type="button" class="action-btn cancel-btn cancel-inline-product-edit" data-id="${productId}">Cancel</button>
                </div>
              </form>
            </div>
          </td>
        `;
        tbody.appendChild(inlineForm);
      });

      // Attach event handlers
      document.querySelectorAll(".edit-product-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          toggleInlineProductForm(btn.dataset.id);
        });
      });

      document.querySelectorAll(".delete-product-btn").forEach((btn) => {
        btn.addEventListener("click", () => deleteProduct(btn.dataset.id));
      });

      // Handle inline form submissions
      document.querySelectorAll(".inline-product-form").forEach((form) => {
        form.addEventListener("submit", async (e) => {
          e.preventDefault();
          await saveInlineProduct(form);
        });
        
        // Add auto-generate slug for inline forms
        const titleInput = form.querySelector('input[name="title"]');
        const slugInput = form.querySelector('input[name="slug"]');
        const productId = form.querySelector('input[name="id"]').value;
        
        titleInput.addEventListener('input', function() {
          const title = this.value.trim();
          // Only auto-generate if slug is empty or product is new
          if ((!productId || slugInput.value === '') && title) {
            slugInput.value = generateSlug(title);
          }
        });
      });

      // Handle cancel buttons
      document.querySelectorAll(".cancel-inline-product-edit").forEach((btn) => {
        btn.addEventListener("click", () => {
          const form = document.getElementById(`product-edit-form-${btn.dataset.id}`);
          form.style.display = 'none';
          form.classList.remove('active');
        });
      });

      // Handle inline image deletion
      document.querySelectorAll(".delete-inline-product-image-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const productId = btn.dataset.id;
          const form = btn.closest('.inline-product-form');
          const imageInput = form.querySelector('.inline-product-image-input');
          const existingImage = imageInput.dataset.existingImage;
          
          if (!confirm("Are you sure you want to delete this image?")) return;
          
          try {
            const res = await fetch("php/delete-file.php", {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: `filePath=${encodeURIComponent(existingImage)}&productId=${encodeURIComponent(productId)}`,
            });
            const data = await res.json();
            if (data.success) {
              alert("Image deleted successfully.");
              imageInput.dataset.existingImage = "";
              const previewContainer = btn.closest('.image-preview-container');
              if (previewContainer) {
                previewContainer.remove();
              }
            } else {
              alert(data.error || "Failed to delete image.");
            }
          } catch (err) {
            console.error("Delete image error:", err);
            alert("Error deleting image.");
          }
        });
      });

      // Handle inline video deletion
      document.querySelectorAll(".delete-inline-product-video-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const productId = btn.dataset.id;
          const form = btn.closest('.inline-product-form');
          const videoInput = form.querySelector('.inline-product-video-input');
          const existingVideo = videoInput.dataset.existingVideo;
          
          if (!confirm("Are you sure you want to delete this video?")) return;
          
          try {
            const res = await fetch("php/delete-file.php", {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: `filePath=${encodeURIComponent(existingVideo)}&productId=${encodeURIComponent(productId)}`,
            });
            const data = await res.json();
            if (data.success) {
              alert("Video deleted successfully.");
              videoInput.dataset.existingVideo = "";
              const previewContainer = btn.closest('.video-preview-container');
              if (previewContainer) {
                previewContainer.remove();
              }
            } else {
              alert(data.error || "Failed to delete video.");
            }
          } catch (err) {
            console.error("Delete video error:", err);
            alert("Error deleting video.");
          }
        });
      });
    })
    .catch((err) => console.error("Error loading products:", err));
}

function toggleInlineProductForm(productId) {
  // Hide any other open inline forms
  document.querySelectorAll('.inline-edit-form').forEach(form => {
    form.style.display = 'none';
    form.classList.remove('active');
  });
  
  // Show the clicked form
  const form = document.getElementById(`product-edit-form-${productId}`);
  if (form) {
    form.style.display = 'block';
    form.classList.add('active');
    
    // Scroll to the form if needed
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

async function saveInlineProduct(form) {
  const formData = new FormData(form);
  const productId = formData.get('id');
  
  // Handle image upload if a new file is selected
  const imageInput = form.querySelector('.inline-product-image-input');
  const imageFile = imageInput.files[0];
  
  if (imageFile) {
    const uploadData = new FormData();
    uploadData.append("image_file", imageFile);
    
    try {
      const uploadRes = await fetch("php/upload-image.php", {
        method: "POST",
        body: uploadData,
      });
      const uploadJson = await uploadRes.json();
      if (!uploadJson.success) {
        alert(uploadJson.error || "Image upload failed");
        return;
      }
      formData.set("image", uploadJson.imagePath);
    } catch (err) {
      console.error("Image upload error:", err);
      alert("Error uploading image");
      return;
    }
  } else {
    // Use existing image if no new file
    formData.set("image", imageInput.dataset.existingImage || "");
  }
  
  // Handle video upload if a new file is selected
  const videoInput = form.querySelector('.inline-product-video-input');
  const videoFile = videoInput.files[0];
  
  if (videoFile) {
    // Check file size client-side (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (videoFile.size > maxSize) {
      alert(`Video file is too large (${(videoFile.size / (1024 * 1024)).toFixed(2)}MB). Maximum 50MB allowed.`);
      return;
    }
    
    const uploadData = new FormData();
    uploadData.append("video_file", videoFile);
    
    try {
      const uploadRes = await fetch("php/upload-video.php", {
        method: "POST",
        body: uploadData,
      });
      
      if (uploadRes.status === 413) {
        throw new Error("File too large for server configuration. Please try a smaller video file.");
      }
      
      if (!uploadRes.ok) {
        throw new Error(`Server error: ${uploadRes.status}`);
      }
      
      const uploadJson = await uploadRes.json();
      if (!uploadJson.success) {
        throw new Error(uploadJson.error || "Video upload failed");
      }
      formData.set("video", uploadJson.videoPath);
    } catch (uploadError) {
      console.error("Video upload error:", uploadError);
      alert("Video upload failed: " + uploadError.message);
      return;
    }
  } else {
    // Use existing video if no new file
    formData.set("video", videoInput.dataset.existingVideo || "");
  }
  
  // Send the data
  try {
    const saveRes = await fetch("php/save-product.php", {
      method: "POST",
      body: formData,
    });
    
    const saveText = await saveRes.text();
    let saveJson;
    try {
      saveJson = JSON.parse(saveText);
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr);
      alert("Server returned invalid JSON");
      return;
    }
    
    if (saveJson.success) {
      alert("Product updated successfully");
      loadProducts(); // Reload to refresh the list
    } else {
      alert(saveJson.error || "Error updating product");
    }
  } catch (err) {
    console.error("Save error:", err);
    alert("Unexpected error occurred");
  }
}

// Old editProduct function (kept for reference but not used with inline forms)
function editProduct(id) {
  // This is now handled by toggleInlineProductForm
  toggleInlineProductForm(id);
}

async function saveProduct() {
  const id = document.getElementById("productId").value;
  const title = document.getElementById("productTitle").value.trim();
  const slug = document.getElementById("productSlug").value.trim(); // ADDED
  const category = document.getElementById("productCategory").value.trim();
  const description = document.getElementById("productDescription").value.trim();
  const specs = document.getElementById("productSpecs").value.trim();
  const content = document.getElementById("productContent").value.trim();
  const imageInput = document.getElementById("productImage");
  const videoInput = document.getElementById("productVideo");

  if (!title || !content) {
    alert("Title and content are required");
    return;
  }

  if (!slug) {
    alert("Slug is required for SEO-friendly URLs");
    return;
  }

  try {
    let finalImagePath = imageInput.dataset.existingImage || "";
    let finalVideoPath = videoInput.dataset.existingVideo || "";

    // Handle image upload
    const imageFile = imageInput.files[0];
    if (imageFile) {
      console.log("Uploading image file:", imageFile.name);
      const uploadData = new FormData();
      uploadData.append("image_file", imageFile);
      const uploadRes = await fetch("php/upload-image.php", {
        method: "POST",
        body: uploadData,
      });
      const uploadJson = await uploadRes.json();
      console.log("Image upload response:", uploadJson);

      if (!uploadJson.success) {
        alert(uploadJson.error || "Image upload failed");
        return;
      }
      finalImagePath = uploadJson.imagePath;
    }

    // Handle video upload with better error handling
    const videoFile = videoInput.files[0];
    if (videoFile) {
      console.log("Uploading video file:", videoFile.name, "Size:", (videoFile.size / (1024 * 1024)).toFixed(2) + "MB");
      
      const uploadData = new FormData();
      uploadData.append("video_file", videoFile);
      
      try {
        const uploadRes = await fetch("php/upload-video.php", {
          method: "POST",
          body: uploadData,
        });
        
        if (uploadRes.status === 413) {
          throw new Error("File too large for server configuration. Please try a smaller video file or contact your hosting provider to increase upload limits.");
        }
        
        if (!uploadRes.ok) {
          throw new Error(`Server error: ${uploadRes.status} - ${uploadRes.statusText}`);
        }
        
        const uploadJson = await uploadRes.json();
        console.log("Video upload response:", uploadJson);

        if (!uploadJson.success) {
          throw new Error(uploadJson.error || "Video upload failed");
        }
        finalVideoPath = uploadJson.videoPath;
        console.log("Video uploaded successfully:", finalVideoPath);
      } catch (uploadError) {
        console.error("Video upload error:", uploadError);
        alert("Video upload failed: " + uploadError.message);
        return;
      }
    }

    console.log("Final paths - Image:", finalImagePath, "Video:", finalVideoPath);

    const formData = new FormData();
    formData.append("id", id);
    formData.append("title", title);
    formData.append("slug", slug); // ADDED
    formData.append("category", category);
    formData.append("description", description);
    formData.append("specifications", specs);
    formData.append("content", content);
    formData.append("image", finalImagePath);
    formData.append("video", finalVideoPath);

    console.log("Saving product data...");
    const saveRes = await fetch("php/save-product.php", {
      method: "POST",
      body: formData,
    });
    
    const saveText = await saveRes.text();
    console.log("Save response:", saveText);
    
    let saveJson;
    try {
      saveJson = JSON.parse(saveText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      alert("Server returned invalid JSON. Check console for details.");
      return;
    }

    if (saveJson.success) {
      alert("Product saved successfully");
      document.getElementById("productForm").style.display = "none";
      loadProducts();
    } else {
      alert("Error saving product: " + (saveJson.error || "Unknown error"));
    }
  } catch (err) {
    console.error("Save error:", err);
    alert("Unexpected error occurred: " + err.message);
  }
}

function deleteProduct(id) {
  if (!confirm("Delete this product?")) return;

  fetch("php/delete-product.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `id=${encodeURIComponent(id)}`,
  })
    .then((r) => r.json())
    .then((data) => {
      if (data.success) {
        alert("Product deleted");
        loadProducts();
      } else {
        alert("Error deleting product");
      }
    })
    .catch(() => alert("Error deleting product"));
}

/* ---------------- UPLOADS ---------------- */
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function loadUploads() {
  fetch("php/get-uploads.php")
    .then((r) => r.json())
    .then((files) => {
      const tbody = document.querySelector("#uploads-table tbody");
      tbody.innerHTML = "";
      if (!Array.isArray(files)) {
        const errorMessage = escapeHtml(files?.error || "Failed to load uploads");
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:red;padding:12px;">${errorMessage}</td></tr>`;
        return;
      }
      files.forEach((file) => {
        const fileName = String(file.name || "");
        const escapedFileName = escapeHtml(fileName);
        const encodedFileName = encodeURIComponent(fileName);
        const fileUrl = `uploads/${encodedFileName}`;
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
        const isVideo = /\.(mp4|mpeg|mov|avi|wmv|webm)$/i.test(fileName);
        let preview = `<span>${escapedFileName}</span>`;
        
        if (isImage) {
          preview = `<img src="${fileUrl}" alt="${escapedFileName}" style="max-width:80px;max-height:80px;border-radius:5px;">`;
        } else if (isVideo) {
          preview = `<video src="${fileUrl}" style="max-width:80px;max-height:80px;border-radius:5px;" controls></video>`;
        }
        
        const tr = document.createElement("tr");
        tr.innerHTML = `
                    <td>${preview}</td>
                    <td>${escapedFileName}</td>
                    <td>${formatFileSize(file.size)}</td>
                    <td>${escapeHtml(file.date)}</td>
                    <td>
                        <a href="${fileUrl}" target="_blank" class="action-btn edit-btn">Download</a>
                        <button class="action-btn delete-btn delete-upload-btn" data-filename="${escapeAttr(fileName)}">Delete</button>
                    </td>
                `;
        tbody.appendChild(tr);
      });

      tbody.querySelectorAll(".delete-upload-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (!confirm("Delete this file?")) return;
          fetch("php/delete-upload.php", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `filename=${encodeURIComponent(btn.dataset.filename)}`,
          })
            .then((r) => r.json())
            .then((res) => {
              if (res.success) {
                alert("File deleted");
                loadUploads();
              } else {
                alert(res.error);
              }
            });
        });
      });
    })
    .catch((err) => {
      const tbody = document.querySelector("#uploads-table tbody");
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:red;padding:12px;">${escapeHtml(err.message || "Failed to load uploads")}</td></tr>`;
      }
    });
}
