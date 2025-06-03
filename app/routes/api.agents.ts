import { type ActionFunctionArgs, type LoaderFunctionArgs, json } from '@remix-run/cloudflare';
import { agentService } from '~/lib/services/agentService';
import type { AgentProfile } from '~/utils/types';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('AgentsAPI');

// GET /api/agents - Récupérer tous les agents
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const agents = await agentService.listAgentProfiles();
    return json({ agents });
  } catch (error) {
    logger.error('Erreur lors de la récupération des agents:', error);
    return json(
      { error: 'Erreur lors de la récupération des agents' },
      { status: 500 }
    );
  }
}

// POST /api/agents - Créer un nouvel agent
// PUT /api/agents - Mettre à jour un agent existant
// DELETE /api/agents - Supprimer un agent
export async function action({ request }: ActionFunctionArgs) {
  const method = request.method;
  
  try {
    switch (method) {
      case 'POST': {
        const agentData = await request.json() as Omit<AgentProfile, 'id' | 'createdAt' | 'updatedAt'>;
        
        // Validation des données requises
        if (!agentData.name || !agentData.description || !agentData.initialPrompt || !agentData.model || !agentData.provider) {
          return json(
            { error: 'Données manquantes pour créer l\'agent' },
            { status: 400 }
          );
        }
        
        const newAgent = await agentService.createAgentProfile(agentData);
        logger.info('Agent créé:', newAgent.id);
        
        return json({ agent: newAgent }, { status: 201 });
      }
      
      case 'PUT': {
        const { id, ...updates } = await request.json() as Partial<AgentProfile> & { id: string };
        
        if (!id) {
          return json(
            { error: 'ID de l\'agent requis pour la mise à jour' },
            { status: 400 }
          );
        }
        
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
        const { id } = await request.json() as { id: string };
        
        if (!id) {
          return json(
            { error: 'ID de l\'agent requis pour la suppression' },
            { status: 400 }
          );
        }
        
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
    logger.error('Erreur dans l\'API agents:', error);
    return json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}