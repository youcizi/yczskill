import type { APIRoute } from 'astro';
import skillsMaster from '../../data/skills-master.json';
import mcpsMaster from '../../data/mcps-master.json';

export const GET: APIRoute = () => {
  const allResources = [
    ...skillsMaster.map(s => ({ ...s, type: 'skill' })),
    ...mcpsMaster.map(m => ({ ...m, type: 'mcp' }))
  ];

  return new Response(JSON.stringify({
    status: "success",
    count: allResources.length,
    items: allResources.map(item => ({
      id: item.id,
      name: { zh: item.name, en: item.name_en },
      description: { zh: item.description, en: item.description_en },
      type: item.type,
      category: item.category,
      icon: item.icon,
      author: item.author,
      download_url: item.download_url,
      mcp_config: item.mcp_config
    }))
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
