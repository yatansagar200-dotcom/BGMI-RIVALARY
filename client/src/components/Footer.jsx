import { WhatsAppIcon, CallIcon } from "./SupportIcons";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white py-6 mt-10 border-t border-slate-800">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between px-4 gap-4">
        <div className="text-center md:text-left">
          <span className="font-bold text-lg text-yellow-400">Support & Helpline:</span>
          <span className="ml-2 text-white">+91 7668261126</span>
        </div>
        <div className="flex gap-4 items-center">
          <a href="https://wa.me/917668261126" target="_blank" rel="noopener noreferrer" title="WhatsApp Support">
            <WhatsAppIcon className="text-green-500 hover:text-green-600 transition" />
          </a>
          <a href="tel:+917668261126" title="Call Helpline">
            <CallIcon className="text-blue-500 hover:text-blue-600 transition" />
          </a>
        </div>
      </div>
    </footer>
  );
}
