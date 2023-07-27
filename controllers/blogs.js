const blogsRouter = require('express').Router()
const Blog = require('../models/blog')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog
    .find({}).populate('user', {username: 1, name: 1})
  response.json(blogs)
})

blogsRouter.post('/', async (request, response) => {
  const user = request.user
  const body = request.body

  if (!user) response.status(401)
    .json({ error: 'no token was provided' })

  const blog = new Blog({
    title: body.title,
    author: body.author,
    user: user._id,
    url: body.url,
    likes: body.likes || 0
  })
  
  const newBlog = await blog.save()

  user.blogs = user.blogs.concat(newBlog._id)
  await user.save()

  response.status(201).json(newBlog)
})


blogsRouter.delete('/:id', async (request, response) => {
  const user = request.user
  const blogToDelete = await Blog.findById(request.params.id)

  if (!user) response.status(401)
    .json({ error: 'no token was provided' })

  if (blogToDelete.user.toString() === user.id.toString()) {
    await Blog.findByIdAndDelete(request.params.id)
    user.blogs = user.blogs.filter(blog => blog._id !== blogToDelete._id)
    await user.save()
    response.status(204).end()
  } else {
    response.status(401).json({error: 'user is not authorized to delete this blog'})
  }
})

blogsRouter.put('/:id', async (request, response) => {
  const user = request.user
  const blogUpdate = {...request.body}

  const blog = await Blog.findById(request.params.id)

  if (!blog) response.status(404).end()
  if (!user) response.status(401)
    .json({ error: 'no token was provided' })

  if (blog.user.toString() === user.id.toString()) {
    const updatedNote = await Blog.findByIdAndUpdate(
      request.params.id,
      blogUpdate,
      { new: true, runValidators: true, context: 'query' }
    )
    
    response.json(updatedNote)
  } else {
    response.status(401).json({ error: 'user is not authorized to update this blog' })
  }
})

module.exports = blogsRouter