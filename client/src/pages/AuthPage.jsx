import { useState } from 'react';
import { Card, Tabs, Form, Input, Button, message, Typography } from 'antd';
import { ShopOutlined, LockOutlined, MailOutlined, PhoneOutlined, NumberOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export default function AuthPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onLogin = async (values) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      message.success('Добро пожаловать в B2B-портал!');
      navigate('/');
    } catch (err) {
      message.error(err.response?.data?.error || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (values) => {
    setLoading(true);
    try {
      await register(values);
      message.success('Заявка дилера зарегистрирована!');
      navigate('/');
    } catch (err) {
      message.error(err.response?.data?.error || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  const items = [
    {
      key: 'login',
      label: 'Вход для партнеров',
      children: (
        <Form layout="vertical" onFinish={onLogin}>
          <Form.Item name="email" label="Корпоративный Email" rules={[{ required: true, type: 'email', message: 'Введите корректный Email' }]}>
            <Input prefix={<MailOutlined />} placeholder="dealer@company.ru" size="large" />
          </Form.Item>
          <Form.Item name="password" label="Пароль" rules={[{ required: true, message: 'Введите пароль' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="••••••" size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={loading}>
            Войти в кабинет
          </Button>
        </Form>
      ),
    },
    {
      key: 'register',
      label: 'Стать дилером (Регистрация)',
      children: (
        <Form layout="vertical" onFinish={onRegister}>
          <Form.Item name="companyName" label="Юридическое название компании" rules={[{ required: true, message: 'Укажите название организации' }]}>
            <Input prefix={<ShopOutlined />} placeholder='ООО "ТехноСнаб"' size="large" />
          </Form.Item>
          <Form.Item name="inn" label="ИНН организации (10 или 12 цифр)" rules={[{ required: true, pattern: /^\d{10}(\d{2})?$/, message: 'ИНН должен состоять из 10 или 12 цифр' }]}>
            <Input prefix={<NumberOutlined />} placeholder="7701234567" maxLength={12} size="large" />
          </Form.Item>
          <Form.Item name="phone" label="Контактный телефон" rules={[{ required: true, message: 'Укажите телефон' }]}>
            <Input prefix={<PhoneOutlined />} placeholder="+7 (999) 000-00-00" size="large" />
          </Form.Item>
          <Form.Item name="email" label="Email для входа и счетов" rules={[{ required: true, type: 'email', message: 'Введите Email' }]}>
            <Input prefix={<MailOutlined />} placeholder="zakupki@company.ru" size="large" />
          </Form.Item>
          <Form.Item name="password" label="Пароль (минимум 6 символов)" rules={[{ required: true, min: 6, message: 'Минимум 6 символов' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="••••••" size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={loading}>
            Подать заявку и создать кабинет
          </Button>
        </Form>
      ),
    },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5', padding: 16 }}>
      <Card style={{ width: 460, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Title level={3} style={{ marginBottom: 4 }}>B2B Портал Поставщика</Title>
          <Text type="secondary">Оптовый каталог оборудования и система предзаказов</Text>
        </div>
        <Tabs defaultActiveKey="login" items={items} centered />
      </Card>
    </div>
  );
}