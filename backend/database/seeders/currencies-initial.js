'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🚀 Insertando monedas por defecto...');

    try {
      await queryInterface.bulkInsert('Currencies', [
        {
          code: 'MXN',
          name: 'Peso Mexicano',
          symbol: '$',
          is_active: true,
          decimal_places: 2,
          is_default: true, // Moneda por defecto
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          code: 'USD',
          name: 'Dólar Estadounidense',
          symbol: 'US$',
          is_active: true,
          decimal_places: 2,
          is_default: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          code: 'EUR',
          name: 'Euro',
          symbol: '€',
          is_active: true,
          decimal_places: 2,
          is_default: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ], {});

      console.log('✅ Monedas insertadas correctamente.');
    } catch (error) {
      console.error('❌ Error al insertar monedas:', error);
    }
  },

  async down(queryInterface, Sequelize) {
    console.log('🧹 Eliminando monedas...');
    try {
      await queryInterface.bulkDelete('Currencies', null, {});
      console.log('✅ Monedas eliminadas correctamente.');
    } catch (error) {
      console.error('❌ Error al eliminar monedas:', error);
    }
  }
};
