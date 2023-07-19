const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const middleware = require('../utils/middleware')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({})
  response.json(blogs)
})

blogsRouter.post('/', async (request, response) => {
  const blog = new Blog(request.body)
  const result = await blog.save()
  response.status(201).json(result)
})


blogsRouter.delete('/:id', async (request, response) => {
  await Blog.findByIdAndRemove(request.params.id)
  response.status(204).end()
})

blogsRouter.put('/:id', async (request, response) => {
  const blogUpdate = {...request.body}
  const updatedNote = await Blog.findByIdAndUpdate(
    request.params.id,
    blogUpdate,
    { new: true, runValidators: true, context: 'query' }
  )
    
  if (updatedNote) {
    response.json(updatedNote)
  } else {
    response.status(404).end()
  }
})

module.exports = blogsRouter