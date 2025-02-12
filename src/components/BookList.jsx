import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './BookList.css'

function BookList() {
  const [books, setBooks] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    // 这里需要实现一个后端API来获取books目录下的书籍列表
    // 暂时使用模拟数据
    const fetchBooks = async () => {
      const bookList = [
        {
          id: '1',
          title: '功能性意象訓練（測試用）',
          filename: '功能性意象訓練（測試用）.epub',
          cover: null
        },
        {
          id: '2',
          title: '迷妹的韓文自學法_黑體加粗（測試用）',
          filename: '迷妹的韓文自學法_黑體加粗（測試用）.epub',
          cover: null
        },
        
        // 可以添加更多书籍
      ]
      setBooks(bookList)
    }

    fetchBooks()
  }, [])

  const handleBookSelect = (book) => {
    navigate(`/reader/${encodeURIComponent(book.filename)}`)
  }

  return (
    <div className="book-list">
      <h1>我的书架</h1>
      <div className="books-grid">
        {books.map(book => (
          <div 
            key={book.id} 
            className="book-item"
            onClick={() => handleBookSelect(book)}
          >
            {book.cover ? (
              <img src={book.cover} alt={book.title} />
            ) : (
              <div className="book-cover-placeholder">
                <span>{book.title[0]}</span>
              </div>
            )}
            <div className="book-title">{book.title}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default BookList 