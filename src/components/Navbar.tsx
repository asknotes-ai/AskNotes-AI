
import { MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="border-b py-4 px-6 bg-white">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <MessageSquare className="h-6 w-6 text-blue-600" />
          <span className="text-xl font-semibold text-blue-600">AskNotes.AI</span>
        </Link>
        <div className="text-sm text-gray-500">
          Turning documents into conversations: smart, simple & adorable
        </div>
        <Link 
          to="/chat" 
          className="text-gray-700 font-medium hover:text-blue-600 transition-colors"
        >
          Open Chat
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
