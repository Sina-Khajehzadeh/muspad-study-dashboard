// Simple Papa.js mock for local testing
window.Papa = {
  parse: function(input, options) {
    if (typeof input === 'string' && input.includes('data/df3_full_for_pivot.csv')) {
      // Generate sample data similar to the CSV structure
      const sampleData = [];
      const standorts = ['reutlingen', 'tübingen', 'stuttgart'];
      const education = ['Certificate after 9 years', 'Certificate after 10 years', 'Higher education certificate'];
      const employment = ['Angestellt', 'Selbstständig', 'Arbeitslos'];
      const income = ['unter 1000 Euro', '1000 bis unter 2000 Euro', '2000 bis unter 6000 Euro', '6000 bis unter 8000 Euro'];
      
      for (let i = 0; i < 480; i++) {
        sampleData.push({
          merge_id: `hiuby-${100000000 + i}`,
          standort: standorts[Math.floor(Math.random() * standorts.length)],
          birth_year: 1940 + Math.floor(Math.random() * 60),
          sex: Math.random() > 0.5 ? 1 : 2,
          age_22: 20 + Math.floor(Math.random() * 60),
          'X20_21_education_clean': education[Math.floor(Math.random() * education.length)],
          'X20_21_kurzfragen_employment_type_clean': employment[Math.floor(Math.random() * employment.length)],
          'X20_21_langfragen_income': income[Math.floor(Math.random() * income.length)],
          'X20_21_kurzfragen_healthstatus_new': 1 + Math.floor(Math.random() * 5),
          'X20_21_condition_hypertension': Math.random() > 0.7 ? 1 : 0,
          'X20_21_condition_diabetes': Math.random() > 0.8 ? 1 : 0,
          'X20_21_serostatus': Math.random() > 0.5 ? 'seronegative' : 'seropositive'
        });
      }
      
      setTimeout(() => {
        if (options.complete) {
          options.complete({
            data: sampleData,
            meta: {
              fields: Object.keys(sampleData[0])
            }
          });
        }
      }, 100);
      
      return;
    }
    
    // Fallback for other cases
    if (options.error) {
      setTimeout(() => options.error(new Error('Mock: File not found')), 100);
    }
  }
};