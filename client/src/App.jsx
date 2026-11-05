import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Button, Tag, Space, Typography, Spin, Alert } from 'antd';
import { LogoutOutlined, SafetyCertificateOutlined, CrownOutlined } from '@ant-design/icons';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';

const { Header, Content } = Layout;
const { Text, Title } = Typography;

const TIER_LABELS = {
  BRONZE: { label: 'Базовый дилер (-5%)', color: 'default' },
  SILVER: { label: 'Серебряный дилер (-10%)', color: 'blue' },
  GOLD: { label: 'Золотой дилер (-15%)', color: 'gold' },
};

function PortalLayout() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}><Spin size="large" /></div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const tierInfo = TIER_LABELS[user.dealerTier] || TIER_LABELS.BRONZE;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#001529', padding: '0 24px' }}>
        <Space size="middle">
          <Title level={4} style={{ color: '#fff', margin: 0 }}>B2B Оборудование</Title>
          <Tag color={user.role === 'ADMIN' ? 'red' : 'geekblue'}>
            {user.role === 'ADMIN' ? 'АДМИНИСТРАТОР ПОСТАВЩИКА' : `${user.companyName} (ИНН: ${user.inn})`}
          </Tag>
        </Space>

        <Space size="middle">
          <Tag icon={<CrownOutlined />} color={tierInfo.color}>{tierInfo.label}</Tag>
          {user.isVerified ? (
            <Tag icon={<SafetyCertificateOutlined />} color="success">Подтвержден</Tag>
          ) : (
            <Tag color="warning">На модерации</Tag>
          )}
          <Text style={{ color: '#fff' }}>{user.email}</Text>
          <Button type="primary" danger icon={<LogoutOutlined />} onClick={logout}>
            Выход
          </Button>
        </Space>
      </Header>

      <Content style={{ padding: '24px 48px' }}>
        {!user.isVerified && (
          <Alert
            message="Ваша компания находится на проверке у менеджера"
            description="После подтверждения реквизитов (ИНН) вам откроются персональные оптовые цены и возможность оформлять предзаказы."
            type="warning"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}
        <div style={{ background: '#fff', padding: 24, borderRadius: 8 }}>
          <Title level={4}>Добро пожаловать, {user.companyName}!</Title>
          <Text>Авторизация и защита сессии через httpOnly куки работают успешно. Следующий шаг — оптовый каталог и админка.</Text>
        </div>
      </Content>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/*" element={<PortalLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}