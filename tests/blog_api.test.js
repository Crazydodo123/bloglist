const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/blog')

beforeEach(async () => {
  await Blog.deleteMany({})
  
  const blogObjects = helper.initialBlogs.map(blog => new Blog(blog))
  
  const promiseArray = blogObjects.map(blog => blog.save())
  await Promise.all(promiseArray)
})

test('returns the correct amount of blogs in JSON format', async () => {
  const response = await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
    
  expect(response.body).toHaveLength(helper.initialBlogs.length)
})

test('each blog has a unique identifier property named id', async () => {
  const blogs = await helper.blogsInDb()
  
  blogs.forEach(blog => {
    expect(blog.id).toBeDefined()
  })
})

test('successfully creates a new blog post', async () => {
  const newBlog = {
    title: 'Async or await',
    author: 'Thomas Moore',
    url: 'http://www.blog.com/async-await',
    likes: 2,
  }
  
  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)
    
  const blogsAtEnd = await helper.blogsInDb()
  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)
  
  const titles = blogsAtEnd.map(blog => blog.title)
  expect(titles).toContain(
    'Async or await'
  )
})

test('likes default to 0 if unspecified', async () => {
  const newBlogWithoutLikes = {
    title: 'Async or await',
    author: 'Thomas Moore',
    url: 'http://www.blog.com/async-await',
  }
  
  await api
    .post('/api/blogs')
    .send(newBlogWithoutLikes)
    
  const blogsAtEnd = await helper.blogsInDb()
  const addedBlog = blogsAtEnd.find(blog => {
    return blog.title === 'Async or await'
  })
  
  expect(addedBlog.likes).toBe(0)
})

test('sends status code 400 if title or url is missing', async () => {
  const badBlog = {
    author: 'Thomas Moore'
  }
  
  await api
    .post('/api/blogs')
    .send(badBlog)
    .expect(400)
    
  const blogsAtEnd = await helper.blogsInDb()
  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
})


afterAll(async () => {
  await mongoose.connection.close()
})

