import { BaseRouter } from "./routes/BaseRouter"
import Navbar from "./ui/components/NavBar"

const SignalApp = () => {
    return (
        <div data-bs-theme="dark" className="bg-body text-body min-vh-100 d-flex flex-column">
            <Navbar />
            <div className="flex-grow-1">
                <BaseRouter />
            </div>
        </div>
    )
}

export default SignalApp