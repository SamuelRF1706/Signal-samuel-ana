import { Route, Routes } from "react-router-dom";
import HomePage from "../pages/HomePage";
import RegisterPage from "../pages/RegisterPage";
import LoginPage from "../pages/LoginPage";
import FeedPage from "../pages/FeedPage";
import PublishTweetPage from '../pages/PublishTweetPage';
import ProfilePage from '../pages/ProfilePage';

export const BaseRouter = () => {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/publish" element={<PublishTweetPage />} />
            <Route path="/profile/:id" element={<ProfilePage />} />
        </Routes>
    );
}