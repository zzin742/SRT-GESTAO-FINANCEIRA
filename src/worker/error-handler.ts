// Error handler middleware para capturar erros não tratados
export const errorHandler = async (c: any, next: any) => {
  try {
    await next();
  } catch (error: unknown) {
    console.error('Erro não tratado:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return c.json({ 
      error: "Erro interno do servidor",
      details: errorMessage
    }, 500);
  }
};
