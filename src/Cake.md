# Cake
The cake is a lie...  Now, with that out of my system, what is the cake pattern and didn't we learn to hate it in PHP?  Lets ignore that for now and look at the core of what the pattern is trying to solve: dependency injection.  Lets take a look at a basic example.

```scala
trait Foo {
    type Foosical

    def iPittyThe: Foosical
}

trait Bar {
    val foo: Foo
    import foo._

    type Result

    def serve: foo.Foosical = foo.iPittyThe
    def drink(the: foo.Foosical): Result
}
```

We created two types `Foo` and `Bar` where `Bar` depends on the world of `Foo`.  One nice thing to point out is that both `Foosical` and `Result` are not defined yet; these interfaces work for all `Foosical` and `Result`.  Now, before we can get `Bar` to `drink` anything, we really do need to know what the type is, so lets define them.

```scala
trait SimpleFoo extends Foo {
    case class Isical(brand: String)
    type Foosical = Isical
}

trait SimpleBar extends Bar {
    val foo: Foo with SimpleFoo
    import foo._

    type Result = Option[String]

    def drink(the: foo.Foosical): Result = the.brand match {
        case "icy" => Some("it was good")
        case _ => None
    }
}
```

Here we created two new traits that extend the traits from before, but now put a bound to the types `Foosical` and `Result` so we have something we can work with.  We have still not tied these to real implementations yet so lets do that.

```scala
object IcyFoo extends SimpleFoo {
    val iPittyThe: Foosical = Isical("icy")
}

object NonNameBrandFoo extends SimpleFoo {
    val iPittyThe: Foosical = Isical("someone else!")
}

object IcyBar extends SimpleBar {
    val foo: Foo with SimpleFoo = IcyFoo
}

object OtherBar extends SimpleBar {
    val foo: Foo with SimpleFoo = NonNameBrandFoo
}
```

So what did we gain here?  Well the concreate implementations are tied together in one location but the traits are not tied to concreate values.  Second, we used [Path Dependent Types](Path Dependent Types.html) so you can't mix `Foosicals` produced from different `Bar`s.

```scala
scala> IcyBar.drink(IcyBar.serve)
res0: IcyBar.Result = Some(it was good)

scala> IcyBar.drink(OtherBar.serve)
<console>:42: error: type mismatch;
 found   : OtherBar.foo.Foosical
    (which expands to)  OtherBar.foo.Isical
 required: IcyBar.foo.Foosical
    (which expands to)  IcyBar.foo.Isical
              IcyBar.drink(OtherBar.serve)
                                    ^
```

One negative is that `IcyBar` won't except `Foosical`s from `IcyFoo`.

```scala
scala> IcyBar.drink(IcyFoo.iPittyThe)
<console>:40: error: type mismatch;
 found   : IcyFoo.Foosical
    (which expands to)  IcyFoo.Isical
 required: IcyBar.foo.Foosical
    (which expands to)  IcyBar.foo.Isical
              IcyBar.drink(IcyFoo.iPittyThe)
```

In this case this seems to be very restricive since `IcyFoo` and `foo` are the same object and the compiler knows this!  But this has one thing that is nice about it, that each trait lives in its own world and can't be poluted from the outside.  Each trait is easier to test now since they can be tested in isolation.

Lets take a look at anther more concreate example

## Cluster Management
Lets say we are working on a new cluster management tool.  A cluster is a named entity that has nodes (which are also named).

```scala
trait ClusterService {
    case class Cluster(name: String) {
        case class Node(name: String)
    }

    type Result[T]

    def getCluster(name: String): Result[Cluster]
    def createCluster(name: String): Result[Cluster]
    def nodes(cluster: Cluster): NodeDetails[cluster.Node]

    // can't make a bound to nodes since the type is dependent on cluster
    trait NodeDetails[N] {
        def list: Result[List[N]]
        def create(name: String): Result[N]
    }
}
```

Now that we have the `ClusterService` we want to be able to do something with it, namely configure the cluster, and orchestrate actions against that cluster.

```scala
trait ConfigService {
    // add the world of ClusterService as a dependency
    val clusterService: ClusterService
    import clusterService._

    type Config
    type Result[T]

    /**
     * Save configs for a node within a cluster
     */
    def saveConfigs(cluster: Cluster, config: Config)(node: cluster.Node): Result[Unit]
    def getConfigs(cluster: Cluster)(node: cluster.Node): Result[Config]
}

trait OrchestrationService {
    // add the world of ClusterService as a dependency
    val clusterService: ClusterService
    import clusterService._

    type Action
    type Result

    def run(action: Action)(cluster: Cluster)(nodes: List[cluster.Node]): Result
}
```

Now lets create a cluster service for testing

```scala
class MemoryClusterService extends ClusterService {
    type Result[T] = Option[T]

    val clusters = collection.mutable.Map.empty[String, Cluster]
    val clusterNodes = collection.mutable.Map.empty[Cluster, List[Cluster#Node]]

    def getCluster(name: String): Result[Cluster] = clusters.get(name)
    def createCluster(name: String): Result[Cluster] = {
        val cluster = Cluster(name)
        clusters.update(name, cluster)
        Some(cluster)
    }

    def nodes(cluster: Cluster): NodeDetails[cluster.Node] = new NodeDetails[cluster.Node] {
        def list: Result[List[cluster.Node]] = clusterNodes.get(cluster).asInstanceOf[Result[List[cluster.Node]]]

        def create(name: String): Result[cluster.Node] = {
            val node = cluster.Node(name)
            val localClusterNodes = list.getOrElse(List[cluster.Node]())
            clusterNodes.update(cluster, node :: localClusterNodes)
            Some(node)
        }
    }
}
```

This `MemoryClusterService` is fully isolated.  Two different services can not interact with each other.

```scala
scala> new MemoryClusterService
res1: MemoryClusterService = MemoryClusterService@5e2b9b75

scala> res1.nodes(res1.createCluster("foo").get)
res2: res1.NodeDetails[cluster.Node] = MemoryClusterService$$anon$1@65231516

scala> res2.list
res3: res1.Result[List[cluster.Node]] = None

scala> res2.create("example.com")
res4: res1.Result[cluster.Node] = Some(Node(example.com))

scala> res2.list
res5: res1.Result[List[cluster.Node]] = Some(List(Node(example.com)))

scala> // lets try to pollute res1

scala> new MemoryClusterService
res6: MemoryClusterService = MemoryClusterService@65c94f13

scala> res1.nodes(res6.createCluster("foo").get))
<console>:1: error: ';' expected but ')' found.
       res1.nodes(res6.createCluster("foo").get))
                                                ^
```
