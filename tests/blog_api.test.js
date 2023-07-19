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

describe('when there is initially some notes saved', () => {
  test('returns blogs with status code 200 in JSON format', async () => {
    const response = await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })
  
  test('returns the correct amount of blogs', async () => {
    const response = await api.get('/api/blogs')
    expect(response.body).toHaveLength(helper.initialBlogs.length)
  })
  
  test('each blog has a unique identifier property named id', async () => {
    const blogs = await helper.blogsInDb()
    
    blogs.forEach(blog => {
      expect(blog.id).toBeDefined()
    })
  })
})

describe('creation of a blog', () => {
  test('succeeds with a valid blog', async () => {
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
  
  test('fails with status code 400 if no title or url', async () => {
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
})

describe('deletion of a blog', () => {
  test('succeeds with a valid id', async () => {
    const blogsAtStart = await helper.blogsInDb()
    
    const blogToDelete = blogsAtStart[0]
    
    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .expect(204)
      
    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length - 1)
  })
  
  test('fails with status code 400 if id does not exist', async () => {
    const badId = 'abced12345'
    
    await api
      .delete(`/api/blogs/${badId}`)
      .expect(400)
    
    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
  })
})

describe('update of a blog', () => {
  test('succeeds with a valid id and blog update', async () => {
    const blogsAtStart = await helper.blogsInDb() 
    const blogToUpdate = blogsAtStart[0]
    
    const updateBlog = {
      title: 'Async or await',
      author: 'Thomas Moore',
      url: 'http://www.blog.com/async-await',
      likes: 4
    }
    
    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(updateBlog)
      .expect(200)
      .expect('Content-Type', /application\/json/)
      
    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
    
    const titles = blogsAtEnd.map(blog => blog.title)
    expect(titles).toContain(
      'Async or await'
    )
  })
  
  test('succeeds with a partial blog update', async () => {
    const blogsAtStart = await helper.blogsInDb() 
    const blogToUpdate = blogsAtStart[0]
    
    const partialUpdate = {
      likes: 4
    }
    
    const to_log = await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(partialUpdate)
      
    const blogsAtEnd = await helper.blogsInDb()
    
    const updatedBlog = blogsAtEnd.find(blog => {
      return blog.title === 'React patterns'
    })
    
    expect(updatedBlog).toBeDefined()
    expect(updatedBlog.likes).toBe(4)
  })
})





afterAll(async () => {
  await mongoose.connection.close()
})

