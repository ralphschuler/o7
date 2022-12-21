import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('addrole')
    .setDescription('Add a role to a member.')
    .addUserOption(option =>
      option.setName('member')
        .setDescription('The member to add the role to.')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('The role to add to the member.')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  async execute(interaction: CommandInteraction) {
    const member = interaction.options.getMember('member');
    const role = interaction.options.get('role');

    if (!member || !role) {
      return interaction.reply('You must provide a member and a role.');
    }

    try {
      // TODO: Find out how to add a role to a member.
      await member.roles.add(role);
      interaction.reply(`Successfully added ${role} to ${member}`);
    } catch (err) {
      console.error(err);
      interaction.reply(`Failed to add ${role} to ${member}.`);
    }
  }
}