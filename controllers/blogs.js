const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const middleware = require('../utils/middleware')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog
    .find({})
    .populate('user', { username: 1, name: 1 })

  response.json(blogs)
})

blogsRouter.post('/', middleware.userExtractor, async (request, response) => {
  const body = request.body
  const user = request.user

  const newBlog = {
    title: body.title,
    url: body.url,
    author: body.author,
    likes: body.likes || 0,
    user: user.id
  }

  const blog = new Blog(newBlog)
  const savedBlog = await blog.save()

  user.blogs = user.blogs.concat(savedBlog.id)
  await user.save()

  response.status(201).json(savedBlog)
})

blogsRouter.delete('/:id', middleware.userExtractor, async (request, response) => {
  const blog = await Blog.findById(request.params.id)
  const user = request.user

  if(blog.user.toString() === user.id.toString()){
    await Blog.findByIdAndDelete(request.params.id)
    user.blogs = user.blogs.filter(item => item.toString() !== request.params.id)
    await user.save()
    return response.status(204).end()
  }
  return response.status(401).json({ error: 'you are not authorized for this operation' })
})

blogsRouter.put('/:id', async(request, response) => {
  const body = request.body

  const newBlog = {
    title: body.title,
    url: body.url,
    author: body.author,
    likes: body.likes || 0
  }

  const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, newBlog, { new: true })
  response.json(updatedBlog)
})

module.exports = blogsRouter