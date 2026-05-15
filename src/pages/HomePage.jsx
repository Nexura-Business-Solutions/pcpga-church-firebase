import StoreInit from '../components/StoreInit.jsx';
import Navbar from '../components/Navbar.jsx';
import Hero from '../components/Hero.jsx';
import StatsStrip from '../components/StatsStrip.jsx';
import MessageSection from '../components/MessageSection.jsx';
import SermonHighlight from '../components/SermonHighlight.jsx';
import MissionVision from '../components/MissionVision.jsx';
import Committees from '../components/Committees.jsx';
import Presbyteries from '../components/Presbyteries.jsx';
import Resources from '../components/Resources.jsx';
import Donation from '../components/Donation.jsx';
import Invitation from '../components/Invitation.jsx';
import Footer from '../components/Footer.jsx';
import AnnouncementModal from '../components/AnnouncementModal.jsx';
import ChatbotWidget from '../components/ChatbotWidget.jsx';
import SectionDivider from '../components/SectionDivider.jsx';
import { Helmet } from 'react-helmet-async';

export default function HomePage() {
  return (
    <>
      <Helmet>
        <title>Presbyterian Church of the Philippines | Welcome Home</title>
        <meta name="description" content="Rooted in the Gospel, Reformed in tradition. Discover a community of faith, hope, and love at the Presbyterian Church of the Philippines." />
      </Helmet>
      <AnnouncementModal />
      <main id="main-content">
        <StoreInit />
        <Navbar />
        <Hero />
        <StatsStrip />
        <MessageSection />
        <SectionDivider />
        <SermonHighlight />
        <MissionVision />
        <SectionDivider />
        <Committees />
        <Presbyteries />
        <SectionDivider />
        <Resources />
        <Donation />
        <Invitation />
        <Footer />
      </main>
      <ChatbotWidget />
    </>
  );
}
