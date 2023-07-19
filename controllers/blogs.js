const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const middleware = require('../utils/middleware')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({})
  response.json(blogs)
})

blogsRouter.post('/', async (request, response, next) => {
  const blog = new Blog(request.body)
  try {
    const result = await blog.save()
    response.status(201).json(result)
  } catch(exception) {
    next(exception)
  }
})


blogsRouter.delete('/:id', async (request, response, next) => {
  try {
    await Blog.findByIdAndRemove(request.params.id)
    response.status(204).end()
  } catch(exception) {
    next(exception)
  }
})

blogsRouter.put('/:id', async (request, response, next) => {
  const blogUpdate = {...request.body}
  try {
    const updatedNote = await Blog.findByIdAndUpdate(
      request.params.id,
      blogUpdate,
      { new: true, runValidators: true, context: 'query' }
    )
    
    response.json(updatedNote)
  } catch(exception) {
    next(exception)
  }
})

module.exports = blogsRouter