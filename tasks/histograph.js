/*
  histograph task fnctions

*/

var settings = require('../settings'),
    neo4j      = require('seraph')(settings.neo4j.histograph.host);


function toLucene(query, field) {
  //excape chars + - && || ! ( ) { } [ ] ^ " ~ * ? : \
  // replace query
  var Q = '(:D)',
      S = '[-_°]',
      q;
  // transform /ciao "mamma bella" ciao/ in 
  // /ciao (:-)mamma[-_°]bella(:-) ciao/
  // note that it transform only COUPLES
  q = query.replace(/"[^"]*"/g, function (m) {
    return m.split(/\s/).join(S).replace(/"/g, Q)
  });

  // delete all the remaining " chars
  q = q.split('"').join('');

  // transform spaces from /ciao "mamma[-_°]bella" ciao/
  // to a list of ["ciao", ""mamma[-_°]bella"", "ciao"]
  // then JOIN with OR operator
  q = q.split(/\s/).filter(function (d){
    return d.trim().length > 1
  });

  q = q.map(function (d) {
    // has BOTH matches of Q?
    var l = [field, ':'];
    if(d.indexOf(Q) === -1)
      l.push('*', d, '*')
    else
      l.push('"', d, '"')
    return l.join('').split(Q).join('')
  }).join(' AND ').split(S).join(' ');
  return q;
};


module.exports = {
  getDoisByEibio: function(options, callback) {
    console.log(clc.yellowBright('\n   tasks.histograph.getPersonByEibio'));
    var dois = [];

    var q = async.queue(function (person, nextPerson) {
      console.log(clc.blackBright('   looking for dois:', clc.cyanBright(person.slug), q.length(), 'remaining'));
    // console.log(person)
      neo4j.query('START per=node:node_auto_index({query}) WITH per WHERE last(labels(per)) = "person" WITH per MATCH (per)-[r]-(t:resource) WHERE has(t.doi) WITH per, {id: id(t), tfidf: r.tfidf, tf: r.tf, doi: t.doi, start_date:t.start_date, end_date:t.end_date, start_time:t.start_time, end_time:t.end_time, name: COALESCE(t.title_en, t.title_fr, t.title_de, t.name)} as media  RETURN per as person, collect(media) as dois', {
        query: toLucene(person.name, 'name_search')
      }, function (err, nodes) {
        if(err) {
          q.kill();
          callback(err);
          return;
        }
        if(!nodes.length) {
          console.log(clc.redBright('   Can\'t find any person matching id:',person.slug));
          nextPerson()
          return;
        }
        // console.log(options.person)
        console.log(clc.blackBright('   people found:', clc.magentaBright(nodes.length)));
        console.log(_.map(_.map(nodes, 'person'),'name'));  
        console.log(clc.blackBright('   dbpedia found:', clc.magentaBright(_.compact(_.map(_.map(nodes, 'person'),'links_wiki')).length)));
        console.log(_.map(_.map(nodes, 'person'),'links_wiki'));  

        // assemble dois
        var _dois = _.sortByOrder(
          _.map(
            _.values(
              _.groupBy(
                _.flatten(
                  _.map(nodes, 'dois')
                ), 'doi'
              )
            ), function (dois) {
            return {
              eibio_slug: person.slug,
              histograph_id: dois[0].id,
              tfidf: _.get(_.max(dois, 'tfidf'), 'tfidf') || 0,
              tf: _.get(_.max(dois, 'tf'), 'tf') || 0,
              doi: _.first(_.compact(_.map(dois, 'doi'))),
              start_date: _.first(_.compact(_.map(dois, 'start_date'))),
              end_date: _.first(_.compact(_.map(dois, 'end_date'))),
              title: _.first(_.compact(_.map(dois, 'name')))
            }
          }), ['tfidf'], ['desc']
        );

        // console.log('example', _.take(_dois, 2));
        console.log(clc.blackBright('   dois found:', clc.magentaBright(_dois.length)));

        dois = dois.concat(_dois);
        console.log(clc.blackBright('   dois global:', clc.magentaBright(dois.length)));
        nextPerson();
      });
  
    }, 1);
    
    q.drain = function(){
      options.dois = dois;
      callback(null, options)
    };

    q.push(options.records);
  },

  getPeople: function() {

  },

  /*
    
  */
  assignMedia: function() {



  }
}