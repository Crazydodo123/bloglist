const lodash = require('lodash')

const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  return blogs.reduce((sum, blog) => {
    return sum + blog.likes
  }, 0)
}

const favoriteBlog = (blogs) => {
  return blogs.reduce((favBlog, blog) => {
    return  blog.likes > favBlog.likes ? blog : favBlog
  })
}

const mostBlogs = (blogs) => {
  const authors = lodash.toPairs(lodash.countBy(blogs, 'author'))
  
  authors.sort((a, b) => {
    return b[1] - a[1]
  })
  
  return {
    author: authors[0][0],
    blogs: authors[0][1]
  }
}

const mostLikes = (blogs) => {
  let authors = {}
  
  blogs.forEach((blog) => {
    const author = blog.author
    
    if (authors[author] === undefined) {
      authors[author] = blog.likes
    } else
      authors[author] += blog.likes
  })
  
  const authorsArr = lodash.toPairs(authors)
  
  authorsArr.sort((a, b) => {
    return b[1] - a[1]
  })
  
  return {
    author: authorsArr[0][0],
    likes: authorsArr[0][1]
  }
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}