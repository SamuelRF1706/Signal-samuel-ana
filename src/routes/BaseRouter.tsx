import { Route, Routes } from "react-router-dom";
import HomePage from "../pages/HomePage";
import RegisterPage from "../pages/RegisterPage";
import LoginPage from "../pages/LoginPage";
import FeedPage from "../pages/FeedPage";
import PublishTweetPage from '../pages/PublishTweetPage';
import ProfilePage from '../pages/ProfilePage';
import FollowingPage from '../pages/FollowingPage';
import FollowersPage from "../pages/FollowersPage";
import UsersPage from "../pages/UsersPage";


export const BaseRouter = () => {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/publish" element={<PublishTweetPage />} />
            <Route path="/profile/:id" element={<ProfilePage />} />
            <Route path="/profile/:id/following" element={<FollowingPage />} />
            <Route path="/profile/:id/followers" element={<FollowersPage />} />
            <Route path="/following" element={<FollowingPage />} />
            <Route path="/followers" element={<FollowersPage />} />
            <Route path="/users" element={<UsersPage />} />
        </Routes>
    );
}
