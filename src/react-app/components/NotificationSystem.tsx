import { useState } from 'react';
import { Bell, X, CheckCircle } from 'lucide-react';

export default function NotificationSystem() {
  const [showNotifications, setShowNotifications] = useState(false);

  // Sem funcionalidade de vencimentos, sempre mostra painel vazio

  

  return (
    <div className="relative">
      {/* Botão de Notificações */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6" />
      </button>

      {/* Dropdown de Notificações */}
      {showNotifications && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowNotifications(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50 max-h-96 overflow-y-auto">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notificações</h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto">
              <div className="p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-gray-500">Nenhuma notificação</p>
                <p className="text-sm text-gray-400">Sistema de notificações simplificado.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
