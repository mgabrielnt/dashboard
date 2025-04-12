import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  IconButton,
  CircularProgress,
  useTheme,
  Divider,
  Avatar
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import axios from 'axios';
import { tokens } from "../theme";

const Chatbot = ({ auth }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      content: 'Selamat datang! Saya adalah asisten AI yang terhubung dengan database Anda. Anda dapat bertanya tentang data dalam bahasa Indonesia, misalnya "Berapa jumlah user yang terdaftar?" atau "Tampilkan data BKI terbaru".',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const messageContainerRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Scroll to the bottom when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for scroll events to show/hide the scroll button
  useEffect(() => {
    const container = messageContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isScrolledUp = scrollHeight - scrollTop - clientHeight > 100;
      setShowScrollButton(isScrolledUp);
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      sender: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        '/api/chatbot/ask',
        { question: userMessage.content },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Add bot response
      const botMessage = {
        sender: 'bot',
        content: response.data.answer,
        sqlQuery: response.data.sqlQuery,
        rawResults: response.data.rawResults,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage = {
        sender: 'bot',
        content: 'Maaf, terjadi kesalahan saat memproses pertanyaan Anda. Silakan coba lagi nanti.',
        error: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Render SQL query with syntax highlighting
  const renderSqlQuery = (query) => {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 1,
          mt: 1,
          backgroundColor: colors.primary[400],
          borderRadius: 1,
          fontFamily: 'monospace',
          fontSize: '0.85rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Typography variant="caption" sx={{ color: colors.grey[400], display: 'block', mb: 0.5 }}>
          SQL Query:
        </Typography>
        <Box sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {query}
        </Box>
      </Paper>
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxWidth: '100%',
        backgroundColor: colors.primary[500],
        borderRadius: '16px',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          backgroundColor: colors.primary[400],
          borderBottom: `1px solid ${colors.primary[300]}`,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <SmartToyOutlinedIcon sx={{ mr: 1, color: colors.greenAccent[500] }} />
        <Typography variant="h5" fontWeight="bold">
          Database Assistant
        </Typography>
      </Box>

      {/* Message Container */}
      <Box
        ref={messageContainerRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}
      >
        {messages.map((message, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%'
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1
              }}
            >
              {message.sender === 'bot' && (
                <Avatar
                  sx={{
                    bgcolor: colors.greenAccent[500],
                    width: 32,
                    height: 32
                  }}
                >
                  <SmartToyOutlinedIcon sx={{ fontSize: '1.2rem' }} />
                </Avatar>
              )}

              <Box>
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    backgroundColor: message.sender === 'user'
                      ? colors.blueAccent[700]
                      : message.error
                        ? colors.redAccent[700]
                        : colors.primary[400],
                    borderRadius: 2,
                    borderTopRightRadius: message.sender === 'user' ? 0 : 2,
                    borderTopLeftRadius: message.sender === 'bot' ? 0 : 2
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    {message.content}
                  </Typography>

                  {message.sqlQuery && renderSqlQuery(message.sqlQuery)}
                </Paper>

                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {formatTimestamp(message.timestamp)}
                </Typography>
              </Box>

              {message.sender === 'user' && (
                <Avatar
                  alt={auth?.user?.name || "User"}
                  src={auth?.user?.profile_picture || ""}
                  sx={{
                    width: 32,
                    height: 32,
                    ml: 1
                  }}
                >
                  {!auth?.user?.profile_picture && <PersonOutlineOutlinedIcon sx={{ fontSize: '1.2rem' }} />}
                </Avatar>
              )}
            </Box>
          </Box>
        ))}
        
        {isLoading && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              alignSelf: 'flex-start',
              gap: 1,
              ml: 5
            }}
          >
            <CircularProgress size={16} />
            <Typography variant="body2" color="text.secondary">
              Database Assistant is thinking...
            </Typography>
          </Box>
        )}
        
        <div ref={messagesEndRef} />
      </Box>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <IconButton
          sx={{
            position: 'absolute',
            bottom: 80,
            right: 24,
            zIndex: 2,
            backgroundColor: colors.primary[400],
            boxShadow: 3,
            '&:hover': {
              backgroundColor: colors.primary[300],
            }
          }}
          onClick={scrollToBottom}
        >
          <ArrowUpwardIcon />
        </IconButton>
      )}

      {/* Input Container */}
      <Box
        sx={{
          p: 2,
          backgroundColor: colors.primary[400],
          borderTop: `1px solid ${colors.primary[300]}`
        }}
      >
        <Box
          sx={{
            display: 'flex',
            gap: 1
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Tanyakan sesuatu tentang data Anda..."
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            multiline
            maxRows={4}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: colors.primary[500],
                '&.Mui-focused fieldset': {
                  borderColor: colors.greenAccent[500],
                },
              }
            }}
          />
          <Button
            variant="contained"
            color="secondary"
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            sx={{ minWidth: '48px', height: '100%' }}
          >
            <SendIcon />
          </Button>
        </Box>
        
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Database Assistant dapat menjawab pertanyaan tentang data dan membantu dengan kueri SQL dalam bahasa Indonesia.
        </Typography>
      </Box>
    </Box>
  );
};

export default Chatbot;