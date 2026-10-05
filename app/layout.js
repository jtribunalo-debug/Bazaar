import './globals.css';
import Header from '../components/Header';
export const metadata = { title: 'Shopora — Shop everything', description: 'Great deals, delivered.' };
export default function RootLayout({ children }) {
  return (<html lang="en"><body><Header />{children}<footer>© {new Date().getFullYear()} Shopora. All rights reserved.</footer></body></html>);
}
