import { useState, useEffect } from 'react';
import { Upload as UploadIcon, File, Trash2, Send, Download, Check } from 'lucide-react';
import type { Upload } from '@/shared/types';

export default function Documents() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchUploads();
  }, []);

  const fetchUploads = async () => {
    try {
      const response = await fetch('/api/uploads');
      if (response.ok) {
        setUploads(await response.json());
      }
    } catch (error) {
      console.error('Erro ao buscar documentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      
      // Determinar categoria baseada no nome do arquivo
      let category = 'outro';
      const filename = file.name.toLowerCase();
      if (filename.includes('nota') || filename.includes('nf')) {
        category = 'nota_fiscal';
      } else if (filename.includes('extrato')) {
        category = 'extrato';
      } else if (filename.includes('comprovante')) {
        category = 'comprovante';
      }
      
      formData.append('category', category);

      try {
        const response = await fetch('/api/uploads', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Erro ao fazer upload');
        }
      } catch (error) {
        console.error('Erro ao fazer upload:', error);
        alert('Erro ao enviar arquivo: ' + file.name);
      }
    }

    setUploading(false);
    fetchUploads();
    
    // Limpar input
    e.target.value = '';
  };

  const handleSendToAccountant = async (id: number, filename: string, category: string) => {
    try {
      const response = await fetch(`/api/uploads/${id}/send-to-accountant`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        fetchUploads();
        
        if (data.accountant_whatsapp) {
          // Criar mensagem para o WhatsApp
          const categoryLabel = getCategoryLabel(category);
          const message = `Olá! Acabei de enviar um novo documento através do FinançaFácil:

📄 *Documento:* ${filename}
📂 *Categoria:* ${categoryLabel}
🕒 *Enviado em:* ${new Date().toLocaleString('pt-BR')}

Por favor, verifique quando possível. Obrigado!`;
          
          // Abrir WhatsApp
          const encodedMessage = encodeURIComponent(message);
          window.open(`https://wa.me/${data.accountant_whatsapp}?text=${encodedMessage}`, '_blank');
        }
      }
    } catch (error) {
      console.error('Erro ao enviar para contador:', error);
    }
  };

  const handleDownload = async (id: number, filename: string) => {
    try {
      const response = await fetch(`/api/uploads/${id}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return;

    try {
      const response = await fetch(`/api/uploads/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchUploads();
      }
    } catch (error) {
      console.error('Erro ao excluir documento:', error);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      nota_fiscal: 'Nota Fiscal',
      extrato: 'Extrato',
      comprovante: 'Comprovante',
      outro: 'Outro',
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      nota_fiscal: 'bg-blue-100 text-blue-800',
      extrato: 'bg-green-100 text-green-800',
      comprovante: 'bg-purple-100 text-purple-800',
      outro: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || colors.outro;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Enviar Documentos</h1>
        <p className="text-gray-600 mt-1">
          Envie notas fiscais, extratos e comprovantes para sua contabilidade
        </p>
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <label className="block">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer">
            <UploadIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              {uploading ? 'Enviando arquivos...' : 'Clique para enviar documentos'}
            </p>
            <p className="text-sm text-gray-500">
              PDF, imagens ou qualquer tipo de arquivo
            </p>
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              accept="*/*"
            />
          </div>
        </label>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-600">Total de Arquivos</p>
          <p className="text-2xl font-bold text-gray-900">{uploads.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-600">Notas Fiscais</p>
          <p className="text-2xl font-bold text-blue-600">
            {uploads.filter(u => u.category === 'nota_fiscal').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-600">Extratos</p>
          <p className="text-2xl font-bold text-green-600">
            {uploads.filter(u => u.category === 'extrato').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-600">Enviados ao Contador</p>
          <p className="text-2xl font-bold text-purple-600">
            {uploads.filter(u => u.sent_to_accountant).length}
          </p>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Documentos Enviados</h3>
        </div>

        {uploads.length === 0 ? (
          <div className="text-center py-12">
            <File className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum documento enviado
            </h3>
            <p className="text-gray-500 mb-4">
              Comece enviando suas notas fiscais e comprovantes
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {uploads.map((upload) => (
              <div key={upload.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <File className="w-6 h-6 text-blue-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900 truncate">
                          {upload.filename}
                        </h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(upload.category)}`}>
                          {getCategoryLabel(upload.category)}
                        </span>
                        {upload.sent_to_accountant && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            <Check className="w-3 h-3 mr-1" />
                            Enviado
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{formatFileSize(upload.file_size)}</span>
                        <span>•</span>
                        <span>{formatDate(upload.created_at)}</span>
                        {upload.sent_at && (
                          <>
                            <span>•</span>
                            <span>Enviado em {formatDate(upload.sent_at)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleDownload(upload.id, upload.filename)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Baixar"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    
                    {!upload.sent_to_accountant && (
                      <button
                        onClick={() => handleSendToAccountant(upload.id, upload.filename, upload.category)}
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Enviar para Contabilidade via WhatsApp"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDelete(upload.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 Como Funciona</h4>
        <p className="text-sm text-blue-800 mb-3">
          Envie regularmente suas notas fiscais, extratos bancários e comprovantes para 
          manter sua contabilidade sempre atualizada. Isso facilita o fechamento mensal 
          e evita pendências.
        </p>
        <p className="text-sm text-blue-800">
          🚀 <strong>Novidade:</strong> Quando você clicar em "Enviar para Contabilidade", 
          o WhatsApp do seu contador será aberto automaticamente com uma mensagem informando 
          sobre o documento enviado!
        </p>
      </div>
    </div>
  );
}
