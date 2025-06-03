import { type ActionFunctionArgs, type LoaderFunctionArgs, json } from '@remix-run/cloudflare';
import { agentService } from '~/lib/services/agentService';
import type { AgentChatThread } from '~/utils/types';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('AgentThreadsAPI');

// GET /api/agents/threads?agentId=xxx - Récupérer les threads d'un agent
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const agentId = url.searchParams.get('agentId');
  
  if (!agentId) {
    return json(
      { error: 'ID de l\'agent requis' },
      { status: 400 }
    );
  }
  
  try {
    const threads = await agentService.getAgentThreads(agentId);
    return json({ threads });
  } catch (error) {
    logger.error('Erreur lors de la récupération des threads:', error);
    return json(
      { error: 'Erreur lors de la récupération des threads' },
      { status: 500 }
    );
  }
}

// POST /api/agents/threads - Créer un nouveau thread
// PUT /api/agents/threads - Sauvegarder un thread
// DELETE /api/agents/threads - Supprimer un thread
export async function action({ request }: ActionFunctionArgs) {
  const method = request.method;
  
  try {
    switch (method) {
      case 'POST': {
        const { agentId, title } = await request.json() as { agentId: string; title?: string };
        
        if (!agentId) {
          return json(
            { error: 'ID de l\'agent requis pour créer un thread' },
            { status: 400 }
          );
        }
        
        const newThread = await agentService.createAgentThread(agentId, title);
        logger.info('Thread créé:', newThread.id);
        
        return json({ thread: newThread }, { status: 201 });
      }
      
      case 'PUT': {
        const threadData = await request.json() as AgentChatThread;
        
        if (!threadData.id || !threadData.agentId) {
          return json(
            { error: 'ID du thread et de l\'agent requis pour la sauvegarde' },
            { status: 400 }
          );
        }
        
        const savedThread = await agentService.saveAgentThread(threadData);
        logger.info('Thread sauvegardé:', threadData.id);
        
        return json({ thread: savedThread });
      }
      
      case 'DELETE': {
        const { agentId, threadId } = await request.json() as { agentId: string; threadId: string };
        
        if (!agentId || !threadId) {
          return json(
            { error: 'ID de l\'agent et du thread requis pour la suppression' },
            { status: 400 }
          );
        }
        
        const success = await agentService.deleteAgentThread(agentId, threadId);
        
        if (!success) {
          return json(
            { error: 'Thread non trouvé' },
            { status: 404 }
          );
        }
        
        logger.info('Thread supprimé:', threadId);
        return json({ success: true });
      }
      
      default:
        return json(
          { error: 'Méthode non supportée' },
          { status: 405 }
        );
    }
  } catch (error) {
    logger.error('Erreur dans l\'API threads:', error);
    return json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}