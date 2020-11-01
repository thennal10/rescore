<template>
  <section class="section has-text-centered">
    <div class="container is-max-desktop">
      <h3>Rescore</h3>
      <UsernameForm @find-user="getUserId"/>
      <p v-if="userError" class="has-text-danger bold">
        User '{{ userError }}' doesn't seem to exist.
        </p>
      <div class="columns mt-5">
        <AnimeCompare 
          v-for="anime in compareSet" :key="anime.id"
          :name="anime.name" :id="anime.id" :largeImgUrl="anime.largeImgUrl" :score="anime.score"
          @comparison-clicked="comparisonClick"
        />
      </div>
      <button class="button is-medium is-danger" @click="newComparison">Skip</button>
    </div>
  </section>
  <section class="section container">
    <button class="button is-medium is-warning" @click="updateList">Update</button>
    <a 
      class="button is-medium is-info ml-4" 
      href='https://anilist.co/api/v2/oauth/authorize?client_id=4281&response_type=token'>
      Login with AniList
    </a>
    <ul>
      <li v-for="anime in sortedAnimeList" :key="anime.id">
        <AnimeItem 
          :name="anime.name" :imgUrl="anime.imgUrl" 
          :score="anime.score" :id="anime.id" :ogScore="anime.ogScore"
        />
      </li>
    </ul>
  </section>
</template>

<script>
import AnimeItem from './components/AnimeItem.vue'
import UsernameForm from './components/UsernameForm.vue'
import AnimeCompare from './components/AnimeCompare.vue'

export default {
  name: 'App',
  components: {
    AnimeItem,
    UsernameForm,
    AnimeCompare
  },
  data() {
    return {
      animeList: [], 
      compareSet: [],
      userError: '',
      accessToken: window.location.hash.match(/(?<=access_token=)(.*?)(?=&)/)[0]
      };
  },
  created() {
    if (sessionStorage.getItem("animeList")) {
      this.animeList = JSON.parse(sessionStorage.getItem("animeList"))
    }
  },
  methods: {
    getUserId(username) {
      // Anilist API query
      var query = `
        query ($name: String) {
          User (search: $name) {
            id
          }
        }
      `;

      var variables = {
        name: username
      };

      var url = 'https://graphql.anilist.co',
        options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            query: query,
            variables: variables
          })
      };

      // Make the HTTP Api request
      fetch(url, options)
        .then(response => {
          if (response.ok) {
            this.userError = '' // Remove any error that was there
            return response.json()
          } else if(response.status === 404) {
            return Promise.reject(404)
          } else {
            return Promise.reject(response.status)
          }
        })
        .then(data => this.getList(data.data.User.id))
        .catch(error => {
          if (error == 404) {
            this.userError = username
          } else {
            console.log("Error:", error)
          }
        })
      
      /*function handleData(data) {
        console.log(data);
      }*/
    },

    getList(id) {
      // Anilist API query
      var query = `
        query ($userId: Int) {
          MediaListCollection (userId: $userId, type: ANIME) {
            lists {
              name
              status
              entries {
                score(format: POINT_100)
                media {
                  id
                  title {
                    romaji
                  }
                  coverImage {
                    extraLarge
                    large
                    medium
                    color
                  }
                }
              }
            }
          }
        }
      `;

      var variables = {
        userId: id
      };

      var url = 'https://graphql.anilist.co',
        options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            query: query,
            variables: variables
          })
      };

      // Make the HTTP Api request
      fetch(url, options)
        .then(response => response.json())
        .then(data => this.renderList(data));
        
    },

    renderList(data) {
      this.animeList.length = 0
      for (var list of data.data.MediaListCollection.lists) {
        if (list.status=="COMPLETED") {
          for (var entry of list.entries) {
            var score = entry.score;
            var item_id = entry.media.id;
            var title = entry.media.title.romaji;
            var cover = entry.media.coverImage.medium;
            var large = entry.media.coverImage.extraLarge;
            this.animeList.push({ name: title, id: item_id, imgUrl: cover, largeImgUrl: large, score: score, ogScore: score});
          }
        }
      }
    },

    updateList() {
      if (!this.accessToken) {
        return console.log("dwaio")
      
      }

      // Filter and round anime scores
      var filteredAnimeList = this.animeList.filter(anime => anime.score != anime.ogScore);
      var scoreList = filteredAnimeList.map(anime => anime.score > 100 ? 100 : anime.score < 1 ? 1 : Math.round(anime.score))

      // Cobble up the query and variables
      var queryVariableHeader = ''
      var query = ''
      var variables = {}

      for (const [index, anime] of filteredAnimeList.entries()) {
        queryVariableHeader += `$id${index}: Int, $score${index}: Int,`
        query += `
          s${index}: SaveMediaListEntry (mediaId: $id${index}, scoreRaw: $score${index}) {
            score
          }`
        variables[`id${index}`] = anime.id
        variables[`score${index}`] = scoreList[index]
      }

      queryVariableHeader = queryVariableHeader.slice(0, -1) // Removes the final comma
      query = `mutation (${queryVariableHeader}) {\n` + query + '}'
      
      // Set up the request and send it
      var url = 'https://graphql.anilist.co',
      options = {
          method: 'POST',
          headers: {
              'Authorization': 'Bearer ' + this.accessToken,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
          },
          body: JSON.stringify({
              query: query,
              variables: variables
          })
      };

      fetch(url, options)
        .then(response => response.json())
        .then(data => console.log(data))
    },

    comparisonClick(id) {
      var winner = this.compareSet.find(anime => anime.id == id)
      var loser = this.compareSet.find(anime => anime.id != id)
      
      // Ripped straight from the wikipedia page for elo rating system
      var expectedW = 1/(1 + (10 ** ((loser.score - winner.score)/20)))
      winner.score = winner.score + 8*(1 - expectedW)
      
      var expectedL = 1/(1 + (10 ** ((winner.score - loser.score)/20)))
      loser.score = loser.score + 8*(0 - expectedL)
      
      this.newComparison()
    },

    newComparison() {
      this.compareSet.length = 0;

      // Because lol javascript
      const random = (len) => Math.floor(Math.random() * len)

      var randomItem1 = this.animeList[random(this.animeList.length)];
      var animeListFiltered = this.animeList.filter(item => item != randomItem1) // Remove it from pool
      var randomItem2 = animeListFiltered[random(animeListFiltered.length)]
      this.compareSet = [randomItem1, randomItem2]
    }
  },
  computed: {
    // So I don't have to bother with resorting the array and saving state every time I make a change
    sortedAnimeList: function() {
      sessionStorage.setItem('animeList', JSON.stringify(this.animeList))
      return [...this.animeList].sort((a, b) => b.score - a.score); // thank you ES6, very cool
    }
  }
}
</script>
