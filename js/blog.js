document.addEventListener('DOMContentLoaded', function() {
  fetchBlogPosts();
});

function fetchBlogPosts() {
  fetch('php/get-blog-posts.php')
    .then(response => response.json())
    .then(posts => {
      const blogGrid = document.getElementById('blogPosts');
      blogGrid.innerHTML = '';
      
      posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'blog-post';
        
        // Use slug if available, otherwise fall back to ID
        const postUrl = post.slug ? 
          `blog-single.html?${encodeURIComponent(post.slug)}` : 
          `blog-single.html?id=${post.id}`;
        
        postElement.innerHTML = `
<a href="${postUrl}" class="learn">
  <img src="${post.image || 'images/blog-default.jpg'}" alt="OceanArc Exim" loading="lazy">
  <div class="blog-content">
    <h3>${post.title}</h3>
    <p>${post.excerpt || post.content.substring(0, 150)}...</p>
    <a href="${postUrl}" class="learn-more">Read more <i class="fas fa-arrow-right"></i></a>
  </div>
</a>
        `;
        blogGrid.appendChild(postElement);
      });
    })
    .catch(error => {
      console.error('Error loading blog posts:', error);
      document.getElementById('blogPosts').innerHTML = '<p>Error loading blog posts. Please try again later.</p>';
    });
}
