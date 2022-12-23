import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import Fuse from "fuse.js";
import neo4j from 'neo4j-driver';
import systems from '../data/systems.json';
import config from "../config";

export function printSecurity(system: { Security: number }) {
  if (system.Security >= 0.5) {
    return `(HS ${system.Security})`
  } else if (system.Security > 0) {
    return `(LS ${system.Security})`;
  }
  return `(NS ${system.Security})`;
}

export const fuse = new Fuse(systems, {
  keys: [
    'Name',
  ],
});

export function getSystems(interaction: CommandInteraction, args: { start: string; end: string }) {
  const startSearch = fuse.search(args.start);
  if (startSearch.length == 0) {
    interaction.reply(`Could not find any system matching '${args.start}'`);
    return;
  }
  const start = startSearch[0].item.Name;

  const endSearch = fuse.search(args.end);
  if (endSearch.length == 0) {
    interaction.reply(`Could not find any system matching '${args.end}'`);
    return;
  }
  const end = endSearch[0].item.Name;

  if (start === end) {
    interaction.reply(`That's the same system!`);
    return;
  }
  return {
    start: startSearch[0].item,
    end: endSearch[0].item,
  }
}

export default {
  data: new SlashCommandBuilder()
    .setName('jumps')
    .setDescription('This command will return the shortest jump distance to travel between two given systems.')
    .addStringOption(option =>
      option.setName('start')
        .setDescription('The starting system.')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('end')
        .setDescription('The ending system.')
        .setRequired(true)),
  async execute(interaction: CommandInteraction) {
    const start = interaction.options.get('start')?.value as string;
    const end = interaction.options.get('end')?.value as string;
    const systems = getSystems(interaction, { start, end});
    if (!systems) return;

    const driver = neo4j.driver(config.neo4j.uri,
      neo4j.auth.basic(config.neo4j.username, config.neo4j.password));
    const session = driver.session();
    try {
      const results = await session.run(`
        MATCH (start:System {name: '${systems.start.Name}'}),(end:System {name:'${systems.end.Name}'})
        MATCH path = shortestPath((start)-[:GATES_TO*]-(end))
        RETURN length(path), path
      `);
      let lowest = 1;
      for (const segment of (results.records[0] as any)._fields[1].segments) {
        if (segment.start.properties.security < lowest) {
          lowest = segment.start.properties.security;
        }
        if (segment.end.properties.security < lowest) {
          lowest = segment.end.properties.security;
        }
      }
      return interaction.reply(`**${(results.records[0] as any)._fields[0].low}** ${systems.start.Name}${printSecurity(systems.start)} - ${systems.end.Name}${printSecurity(systems.end)} travels through ${printSecurity({Security: lowest})}`);
    } finally {
      await session.close();
      await driver.close();
    }
  }
};