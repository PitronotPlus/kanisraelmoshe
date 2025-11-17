import Home from './pages/Home';
import Editor from './pages/Editor';
import Advertisers from './pages/Advertisers';
import Article from './pages/Article';
import Articles from './pages/Articles';
import Admin from './pages/Admin';
import UserManagement from './pages/UserManagement';
import Category from './pages/Category';
import SpeakerDashboard from './pages/SpeakerDashboard';
import Archive from './pages/Archive';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Search from './pages/Search';
import AdminSettings from './pages/AdminSettings';
import AdminUsers from './pages/AdminUsers';
import UserSettings from './pages/UserSettings';
import Onboarding from './pages/Onboarding';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Editor": Editor,
    "Advertisers": Advertisers,
    "Article": Article,
    "Articles": Articles,
    "Admin": Admin,
    "UserManagement": UserManagement,
    "Category": Category,
    "SpeakerDashboard": SpeakerDashboard,
    "Archive": Archive,
    "Privacy": Privacy,
    "Terms": Terms,
    "Search": Search,
    "AdminSettings": AdminSettings,
    "AdminUsers": AdminUsers,
    "UserSettings": UserSettings,
    "Onboarding": Onboarding,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};