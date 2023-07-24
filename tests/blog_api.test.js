const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')

const app = require('../app')
const api = supertest(app)

const Blog = require('../models/blog')
const User = require('../models/user')

beforeEach(async () => {
  await Blog.deleteMany({})
  await User.deleteMany({})

  const rootUser = {
    username: 'root',
    password: 'admin'
  }
  
  const response = await api
    .post('/api/users')
    .send(rootUser)


  const blogObjects = helper.initialBlogs.map(blog => {
    blog.user = response.body.id
    return new Blog(blog)
  })

  const promiseArray = blogObjects.map(blog => blog.save())
  await Promise.all(promiseArray)
})

describe('when there is initially some notes saved', () => {
  test('returns blogs with status code 200 in JSON format', async () => {
    await api
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
    
    const token = await helper.getToken()

    await api
      .post('/api/blogs')
      .send(newBlog)
      .set('authorization', `Bearer ${token}`)
      .expect(201)
      
      
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
    
    const token = await helper.getToken()

    await api
      .post('/api/blogs')
      .send(newBlogWithoutLikes)
      .set('authorization', `Bearer ${token}`)
      
    const blogsAtEnd = await helper.blogsInDb()
    const addedBlog = blogsAtEnd.find(blog => {
      return blog.title === 'Async or await'
    })
    
    expect(addedBlog.likes).toBe(0)
  })
  
  test('fails with status code 400 if no title or url', async () => {
    const blogsAtStart = await helper.blogsInDb()

    const badBlog = {
      author: 'Thomas Moore'
    }
    
    const token = await helper.getToken()
    
    await api
      .post('/api/blogs')
      .send(badBlog)
      .set('authorization', `Bearer ${token}`)
      .expect(400)
      
    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toEqual(blogsAtStart)
  })

  test('fails with status code 401 if no token was provided', async () => {
    const blogsAtStart = await helper.blogsInDb()
    
    const newBlog = {
      title: 'Async or await',
      author: 'Thomas Moore',
      url: 'http://www.blog.com/async-await',
      likes: 2,
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(401)
      
      
    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toEqual(blogsAtStart)
  })
})

describe('deletion of a blog', () => {
  test('succeeds with a valid id', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    const token = await helper.getToken()

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('authorization', `Bearer ${token}`)
      .expect(204)
      
    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(blogsAtStart.length - 1)

    const titles = blogsAtEnd.map(blog => blog.title)
    expect(titles).not.toContain(blogToDelete.title)
  })
  
  test('fails with status code 400 if id does not exist', async () => {
    const badId = 'abced12345'
    
    await api
      .delete(`/api/blogs/${badId}`)
      .expect(400)
    
    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
  })

  test('fails with status code 401 if no token was provided', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    const token = await helper.getBadToken()

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('authorization', `Bearer ${token}`)
      .expect(401)
      
    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toEqual(blogsAtStart)
  })

  test('fails with status code 401 if user is not authorized', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .expect(401)
      
    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toEqual(blogsAtStart)
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
    
    const token = await helper.getToken()

    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(updateBlog)
      .set('authorization', `Bearer ${token}`)
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
    
    const token = await helper.getToken()

    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(partialUpdate)
      .set('authorization', `Bearer ${token}`)
      
    const blogsAtEnd = await helper.blogsInDb()
    
    const updatedBlog = blogsAtEnd.find(blog => {
      return blog.title === blogToUpdate.title
    })
    
    expect(updatedBlog).toBeDefined()
    expect(updatedBlog.likes).toBe(4)
  })
  
  test('fails with status code 404 if id does not exist', async () => {
    const nonExistantId = await helper.badId()

    const updateBlog = {
      title: 'Async or await',
      author: 'Thomas Moore',
      url: 'http://www.blog.com/async-await',
      likes: 4
    }
    
    const token = await helper.getToken()

    await api
      .put(`/api/blogs/${nonExistantId}`)
      .send(updateBlog)
      .set('authorization', `Bearer ${token}`)
      
    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
    
    const titles = blogsAtEnd.map(blog => blog.title)
    expect(titles).not.toContain(
      'Async or await'
    )
  })
  
  test('fails with status code 400 if id is invalid', async () => {
    const invalidId = '12345abcde'
    
    const updateBlog = {
      title: 'Async or await',
      author: 'Thomas Moore',
      url: 'http://www.blog.com/async-await',
      likes: 4
    }
    
    const token = await helper.getToken()

    await api
      .put(`/api/blogs/${invalidId}`)
      .send(updateBlog)
      .set('authorization', `Bearer ${token}`)
      .expect(400)
      
    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
    
    const titles = blogsAtEnd.map(blog => blog.title)
    expect(titles).not.toContain(
      'Async or await'
    )
  })

  test('fails with status code 401 with an unauthorized user', async () => {
    const blogsAtStart = await helper.blogsInDb() 
    const blogToUpdate = blogsAtStart[0]
    
    const updateBlog = {
      title: 'Async or await',
      author: 'Thomas Moore',
      url: 'http://www.blog.com/async-await',
      likes: 4
    }
    
    const badToken = await helper.getBadToken()

    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(updateBlog)
      .set('authorization', `Bearer ${badToken}`)
      .expect(401)
      
    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toEqual(blogsAtStart)
  })

  test('fails with status code 401 if no token is provided', async () => {
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
      .expect(401)
      
    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toEqual(blogsAtStart)
  })
})


afterAll(async () => {
  await mongoose.connection.close()
})