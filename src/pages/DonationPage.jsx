import { Helmet } from 'react-helmet-async';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import ChatbotWidget from '../components/ChatbotWidget.jsx';
import Donation from '../components/Donation.jsx';

export default function DonationPage() {
  return (
    <>
      <Helmet>
        <title>Donate | PCP</title>
        <meta
          name="description"
          content="Support the mission of the Presbyterian Church of the Philippines through secure online giving."
        />
        <meta property="og:title" content="Give Generously | Presbyterian Church of the Philippines" />
        <meta property="og:description" content="Support the mission through secure online giving." />
      </Helmet>
      <Navbar darkHero />
      <main id="main-content">
        <h1 className="sr-only">Give — Presbyterian Church of the Philippines</h1>
        <Donation />
      </main>
      <Footer />
      <ChatbotWidget />
    </>
  );
}
