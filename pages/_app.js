import "@/styles/globals.css";
import { AuthProvider } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';
import GlobalUI from '../components/GlobalUI';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Component {...pageProps} />
        <GlobalUI />
      </NotificationProvider>
    </AuthProvider>
  );
}
