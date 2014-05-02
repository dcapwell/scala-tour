# Structural Types
When working in java for a long enough time, you will see that different libraries redefine types for themselves.  If you want to be able to work with the different types that structurally do the same thing then you had to define methods for each case.

```scala
val client = HiveMetaStoreClient
val file = open("/tmp/hive-query")
...
close(file)   // def close(c: Closeable)
close(client) // def close(client: HiveMetaStoreClient)
```

But really what you wanted was to say is ["it looka like a closeable"](http://youtu.be/U4EH0RtVlgE?t=35s).

```scala
def close(closeable: { def close: Unit }) = closeable.close
```

This seems great but could make the types look weird.  Lets define an alias for this

```scala
type Closeable = {
    def close: Unit
}
def close(closeable: Closeable) = closeable.close
```

Now our `close` method is nice and clean, and can handle anything that "looka like a closeable"!

Lets play with this a bit more: named things.

```scala
case class Foo(name: String)
case class Bar(name: String)
case class Baz(noName: String)

def name(named: { def name: String }) = named.name

name(Foo("foo"))
// foo

name(Bar("bar"))
// bar

name(Baz("baz"))
<console>:37: error: type mismatch;
 found   : Baz
 required: AnyRef{def name: String}
              name(Baz("baz"))
                      ^
```

Awesome!  The compiler will reject useage of objects that don't looka like a named thing!  This feels a lot like [Go's interfaces](http://golang.org/doc/effective_go.html#interfaces_and_types) but on the JVM!  So, how does this work?  The JVM doesn't have support for this outside of using... reflection!  Yep, thats how structural types are implemented at runtime; they use reflection.  Structural types are a very powerful typing system, but since it uses reflection at runtime you will see a performance hit for using them.  As with most things related to performance, if you use this in the 20% that matter, then switching to multiple methods will give you a boost.

I tend to find that I use structural types in my test code more often than in my main code.  Below is a snippet from one of my test cases that work across multiple case classes that looka alike, but don't share a common trait.

```scala
type Idable = {
    def id: String
}

def testIdExists(i: => Idable) = {
    "where id should exist" in {
      i.id should not be(null)
    }
}

def testIdsMatch(i1: => Idable)(i2: => Idable) = {
    "where id is equal" in {
      i2.id should be (i1.id)
    }
}

type Trackable = {
    def createTS: DateTime
    def modTS: DateTime
}

def testTrackableInit(t: => Trackable) = {
    "that have matching timestamps for createTS and modTS" in {
      t.createTS should be(t.modTS)
    }
}

def testTrackableUpdate(t1: => Trackable)(t2: => Trackable) = {
    "where modify is newer" in {
      t2.modTS.isAfter(t1.modTS) should be (true)
    }
}
```

Structural types are great in tests where we don't care about the reflection overread and don't want to start creating traits just to make testing easier.
