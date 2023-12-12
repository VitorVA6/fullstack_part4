const lodash = require('lodash')

const dummy = (blogs) => {
  return (blogs.length + 1) - blogs.length
}

const totalLikes = (blogs) => {
  const reducer = (sum, item) => {
    return sum + item.likes
  }
  return blogs.reduce(reducer, 0)
}

const favoriteBlog = (blogs) => {
  if(blogs.length === 0) return null
  let largest = 0
  let index = 0
  blogs.forEach((item, i) => {
    if(item.likes > largest){
      largest = item.likes
      index = i
    }
  })
  return blogs[index]
}

const mostBlogs = (blogs) => {
  if(blogs.length === 0) return null
  const result = lodash.countBy(blogs, 'author')
  const ocurrencies = []
  for (const key of Object.keys(result)){
    ocurrencies.push({
      'author': key,
      'blogs': result[key]
    })
  }

  return lodash.maxBy(ocurrencies, 'blogs')
}

const mostLikes = (blogs) => {
  if(blogs.length === 0) return null
  const result = lodash.groupBy(blogs, 'author')
  const authorsRanking = []
  for(const key of Object.keys(result)){
    authorsRanking.push({
      author: key,
      likes: result[key].reduce((sum, item) => sum + item.likes, 0)
    })
  }
  return lodash.maxBy(authorsRanking, 'likes')
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}