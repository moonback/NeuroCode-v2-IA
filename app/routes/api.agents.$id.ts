import { type ActionFunctionArgs, type LoaderFunctionArgs, json } from '@remix-run/cloudflare';
import { agentService } from '~/lib/services/agentService';
import type { AgentProfile } from '~/utils/types';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('AgentAPI');

// GET /api/agents/:id - Récupérer un agent spécifique
export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;
  
  if (!id) {
    return json(
      { error: 'ID de l\'agent requis' },
      { status: 400 }
    );
  }
  
  try {
    const agent = await agentService.getAgentProfile(id);
    
    if (!agent) {
      return json(
        { error: 'Agent non trouvé' },
        { status: 404 }
      );
    }
    
    return json({ agent });
  } catch (error) {
    logger.error('Erreur lors de la récupération de l\'agent:', error);
    return json(
      { error: 'Erreur lors de la récupération de l\'agent' },
      { status: 500 }
    );
  }
}

// PUT /api/agents/:id - Mettre à jour un agent spécifique
// DELETE /api/agents/:id - Supprimer un agent spécifique
export async function action({ request, params }: ActionFunctionArgs) {
  const { id } = params;
  const method = request.method;
  
  if (!id) {
    return json(
      { error: 'ID de l\'agent requis' },
      { status: 400 }
    );
  }
  
  try {
    switch (method) {
      case 'PUT': {
        const updates = await request.json() as Partial<AgentProfile>;
        
        const updatedAgent = await agentService.updateAgentProfile(id, updates);
        
        if (!updatedAgent) {
          return json(
            { error: 'Agent non trouvé' },
            { status: 404 }
          );
        }
        
        logger.info('Agent mis à jour:', id);
        return json({ agent: updatedAgent });
      }
      
      case 'DELETE': {
        const success = await agentService.deleteAgentProfile(id);
        
        if (!success) {
          return json(
            { error: 'Impossible de supprimer l\'agent (agent non trouvé ou agent par défaut)' },
            { status: 400 }
          );
        }
        
        logger.info('Agent supprimé:', id);
        return json({ success: true });
      }
      
      default:
        return json(
          { error: 'Méthode non supportée' },
          { status: 405 }
        );
    }
  } catch (error) {
    logger.error('Erreur dans l\'API agent:', error);
    return json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}