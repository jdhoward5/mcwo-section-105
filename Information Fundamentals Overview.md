# MCWO Section 105: Information Fundamentals Overview

## [[105.1]] Define the following terms

- [[105.1#Data|Data]]
- [[105.1#Information|Information]]
- [[105.1#Bit|Bit]]
- [[105.1#Byte|Byte]]
- [[105.1#Algorithm|Algorithm]]
- [[105.1#Protocol|Protocol]]

## 105.2 Describe the relationship between algorithms, protocols, and encoding information

In plain English, an algorithm is a defined process or recipe for producing a result. A protocol specifies rules, message formats, and procedures that communicating components follow. A protocol may require particular algorithms or encodings, while software uses algorithms to encode, decode, send, receive, and process the data described by the protocol.

### Example

Alice wants to email a photo to her friend Bob. The photo is **data**. SMTP provides a **protocol** for transferring the email, while MIME describes how the attachment is represented in the message. MIME can use **Base64 encoding** to transform the photo's bytes into ASCII characters that are safe to carry through systems designed for text-based email.

Email software implements **algorithms** that apply the encoding, construct and transmit the protocol messages, then reverse those steps for Bob. The algorithms are implemented as parts of the sending and receiving computer programs.

## 105.3 Describe lossy and lossless compression algorithms

Compression algorithms reduce the number of bits needed to represent data by exploiting repetition, predictable patterns, or information that can be discarded. For example, run-length encoding can replace a long sequence of the same value with the value and a count.

Lossless compression permits the original data to be reconstructed exactly: `D -> compression algorithm -> T` and `T -> decompression algorithm -> D`. A **ZIP** archive can use lossless compression methods such as DEFLATE.

Lossy compression discards selected information to achieve a smaller representation. The compressed data can still be decompressed, but the original cannot be reconstructed exactly. The commonly used **JPEG** process is lossy and may introduce visible artifacts; repeatedly decoding and re-encoding a JPEG can accumulate further quality loss, although this does not necessarily change the image's pixel dimensions.

## 105.4 Describe data serialization

Data serialization transforms data structures or objects into a representation that can be stored or transmitted and later reconstructed through deserialization. Python object serialization is called pickling, and serialization is also sometimes called marshaling. For example, a program may serialize values as **JSON** text; when exchanged between systems, that text is normally encoded as UTF-8 bytes. Serialization defines the structure and values, while character or binary encoding maps the resulting representation to bytes or symbols.

## 105.5 Describe the importance of NTP

Network Time Protocol (NTP), specified in RFC 5905 for NTPv4, synchronizes computer system clocks to a time source. Accurate system time is important for comparing logs, ordering events, coordinating distributed systems, enforcing certificate validity periods, and supporting protocols that use timestamps to detect stale or replayed messages. NTP synchronizes timekeeping clocks; it does not synchronize the processor clock that drives instruction execution.

## 105.6 Describe the basic components of a computer

### Input/Output

Screen, keyboard, mouse, printer, etc.

### Processor

A processor executes program instructions and performs arithmetic, logic, control, and data-transfer operations. Modern general-purpose processors commonly contain multiple cores and several levels of cache, allowing some work to be performed in parallel.

### Memory

Main memory is usually implemented as random-access memory (RAM) and serves as working space for programs and the operating system. Most RAM is volatile, so it requires power to retain its contents; processor caches are also forms of volatile memory but are normally discussed separately from main memory.

### Storage

Storage provides non-volatile retention of data and may use hard disk drives, magnetic tape, solid-state drives, or other media. Its data normally persists across power cycles, although no storage medium is literally permanent.

## 105.7 Discuss common CPU architectures

Instruction set architectures, or ISAs, are a model that defines the programmable interface of the CPU of a computer. CPUs _interpret_ instructions described by an ISA.

### x86

x86 is a family of instruction set architectures that began with Intel's 16-bit 8086 processor in 1978 and was extended by Intel, AMD, and others. It has a large, variable-length instruction set and extensive backward compatibility; it is implemented by both Intel and non-Intel processors. Its CISC design does not by itself make a program faster, slower, larger, or smaller than one compiled for a RISC architecture.

### x86_64

x86-64, introduced by AMD as AMD64 and implemented by Intel as Intel 64, extends x86 with 64-bit general-purpose registers and addressing. Its long mode contains a 64-bit submode and a compatibility submode for many existing 16-bit and 32-bit applications.

### Advanced RISC Machines

Arm is a family of reduced instruction set computing (RISC) architectures used in embedded systems, mobile devices, personal computers, and servers. Arm architectures generally emphasize load/store operation, a large register set, and comparatively regular instruction encodings, but Arm instructions are not limited to one function and RISC does not automatically mean more code or faster execution than x86.

## 105.8 Describe the common functions and components of an operating system

### Kernel

The kernel is the privileged core of an operating system. It manages processors, memory, devices, and other resources and provides controlled services to programs.

### System programs

System programs provide services and tools around the kernel, such as command interpreters, service managers, file utilities, and administrative tools. Some device drivers run in the kernel, while others may run as user-space programs.

### Process management

Process management creates, schedules, coordinates, and terminates processes and threads while tracking their states and resources. Memory placement and address translation are closely related but are primarily memory-management functions.

### Memory

#### CPU registers

CPU registers are very small, fast storage locations within a processor. General-purpose, control, status, and vector registers hold operands, addresses, instructions, and execution state, and are used directly by machine instructions or allocated by compilers.

#### Swapping vs. Paging

Historically, swapping moved an entire process between main memory and secondary storage; it did not use a RAM disk. Modern systems often use the term swap for moving selected memory pages to a disk partition or swap file under memory pressure. Paging divides virtual and physical memory into fixed-size pages and frames, allowing an MMU to translate virtual addresses and letting a process use non-contiguous physical memory.

#### Virtual Memory

Virtual memory gives each process its own virtual address space rather than all of the machine's memory. The operating system and MMU map portions of that space to non-contiguous physical memory, files, or swap storage and can leave unmapped regions that are not currently backed by any resource.

#### Stack

Regions of memory where data is added and removed in a last-in-first-out order. Each thread of a process has a reserved region of memory referred to as the stack, and how it is used is governed by how the program is written or compiled.

#### Heap

The heap is a large pool of memory where access and management is relatively freeform. Programs manage requests to allocate, free, and modify memory that is on the heap, and it does not follow a predictable order of access (in contrast to the stack).

#### Memory Mapping

A memory-mapped file associates a region of a process's virtual address space with a file or device, allowing the program to access it through memory operations. Pages are commonly loaded on demand, so a file may be mapped even when it is larger than physical RAM. Memory mapping does not inherently prevent thrashing, which occurs when a workload repeatedly faults pages because its active working set exceeds available memory.

### Storage management

#### File system implementation

A file system defines how an operating system names, organizes, stores, retrieves, and protects files and directories on storage devices. It also tracks metadata such as file size, ownership, permissions, and timestamps.

#### Mass storage

Mass storage provides persistent, high-capacity storage for operating systems, applications, and user data. Common examples include hard disk drives, solid-state drives, optical media, and magnetic tape.

### System calls

System calls are controlled requests that programs make to the operating system kernel for services such as opening files, creating processes, allocating memory, or communicating over a network.

### Signals

Signals are asynchronous notifications sent to a process to report an event or request an action, such as terminating, pausing, resuming, or handling an error. A process may use a signal handler to respond to many signals.

### Network management

Network management includes the operating system functions that configure network interfaces, implement protocol stacks, route traffic, manage connections, and monitor network status and performance.

### Security management

#### Protection & Domains (protection rings)

Protection domains separate resources and privileges so code can access only what it is authorized to use. Protection rings enforce this separation by assigning different privilege levels, with the kernel normally operating in the most privileged ring and applications in less privileged rings.

#### Access control

Access control determines which users, processes, or devices may access a resource and what actions they may perform. Operating systems enforce it through identities, permissions, security policies, and access control lists.

#### Security defenses

Operating-system security defenses include process isolation, memory protection, secure boot, encryption, patching, auditing, firewalls, antimalware controls, and least-privilege enforcement. Together they reduce the likelihood and impact of unauthorized activity.

### I/O device management

I/O device management coordinates communication between software and hardware devices through drivers, interrupts, buffering, and scheduling. It gives programs a consistent interface to devices whose physical operation may differ greatly.

### Command interpreter

A command interpreter, or shell, accepts commands from a user or script and asks the operating system to execute them. It commonly supports launching programs, navigating files, redirecting input and output, and automating tasks.

## 105.9 Describe the following

### Virtualization

Virtualization uses software to create logical versions of computing resources, such as processors, memory, storage, networks, or entire machines. It allows multiple isolated environments to share the same physical hardware.

### Virtual machines

A virtual machine is a software-defined computer with virtual processors, memory, storage, and network devices that runs its own operating system. It behaves like a separate physical machine while using resources supplied by a host system.

### Hypervisor Type 1

A Type 1, or bare-metal, hypervisor runs directly on physical hardware and manages guest virtual machines without a general-purpose host operating system underneath it. This design is common in servers and data centers because it offers strong performance and isolation.

### Hypervisor Type 2

A Type 2, or hosted, hypervisor runs as an application on a conventional operating system. It is convenient for desktops, development, and testing, but adds overhead because guest operations pass through the host operating system.

### Containerization

Containerization packages an application and its dependencies into an isolated environment that shares the host operating system kernel. Containers are typically smaller and faster to start than virtual machines, but provide a different isolation boundary.

### Container orchestrator

A container orchestrator automates the deployment, scheduling, networking, scaling, health monitoring, and recovery of containers across one or more hosts. Kubernetes is a common example.

## 105.10 Explain advantages and disadvantages of virtualization

Virtualization improves hardware utilization, isolation, portability, testing, disaster recovery, and rapid provisioning by allowing several systems to share one physical host. Its disadvantages include performance overhead, greater management complexity, licensing and infrastructure costs, resource contention, and the risk that a host or hypervisor failure can affect multiple virtual machines.

## 105.11 Define the following Cloud and development terms

### Infrastructure-as-a-service

Infrastructure as a service (IaaS) provides virtualized computing resources such as servers, storage, and networking on demand. The provider manages the physical infrastructure while the customer manages the operating systems, applications, and data.

### Platform-as-a-service

Platform as a service (PaaS) provides a managed environment for building, deploying, and running applications. The provider manages the underlying infrastructure and runtime platform while the customer focuses on application code and data.

### Software-as-a-service

Software as a service (SaaS) delivers a complete application over a network, usually through a web browser or client. The provider manages the application and supporting infrastructure while the customer configures and uses the service.

### Cloud service provider

A cloud service provider is an organization that delivers shared computing services such as infrastructure, platforms, storage, or applications over a network. It operates the underlying systems and offers resources through subscriptions, usage-based pricing, or other service agreements.

### Infrastructure-as-code

Infrastructure as code (IaC) manages computing infrastructure through machine-readable configuration files rather than manual setup. This makes environments repeatable, version-controlled, reviewable, and easier to automate.

### Continuous integration/continuous deployment

Continuous integration and continuous delivery or deployment (CI/CD) automate the building, testing, and release of software changes. Continuous integration frequently merges and validates changes; continuous delivery keeps successful changes ready for release, while continuous deployment automatically releases each change that passes the pipeline.

## 105.12 Describe the following common network topologies

### Ring

In a ring topology, each node connects to two neighboring nodes, forming a closed loop through which data travels. A break can interrupt communication unless the network includes a redundant path or self-healing mechanism.

### Mesh

In a mesh topology, nodes connect to many or all other nodes, creating multiple possible paths for traffic. Mesh networks offer high redundancy and resilience but require more links, configuration, and cost.

### Star

In a star topology, every endpoint connects to a central device such as a switch or access point. It is easy to manage and isolate endpoint failures, although failure of the central device can disrupt the network.

### Bus

In a bus topology, all devices share a single main communication line. It uses little cabling, but collisions, troubleshooting difficulty, and failure of the shared backbone can affect the entire network.

### Hybrid

A hybrid topology combines two or more topology types, such as multiple star networks connected by a mesh or bus. It allows a network to balance scalability, cost, performance, and fault tolerance.

## 105.13 Describe the layers of the OSI model

The OSI model divides network communication into seven conceptual layers: Physical transmits bits, Data Link moves frames on a local link, Network routes packets, Transport provides end-to-end delivery, Session manages conversations, Presentation translates or formats data, and Application provides network services to software. Each layer serves the layer above it and uses the layer below it.

## 105.14 Describe the TCP/IP model

The TCP/IP model describes Internet communication in four layers: Link moves data on the local network, Internet addresses and routes packets using IP, Transport provides end-to-end communication using protocols such as TCP or UDP, and Application contains user-facing protocols such as HTTP, DNS, and SMTP. Some references divide the Link layer into separate Data Link and Physical layers.

## 105.15 Describe protocol encapsulation overhead and the effect on payloads moving through the stack

As data moves down a protocol stack, each layer encapsulates it by adding headers and sometimes trailers containing addressing, control, sequencing, or error-checking information. This overhead reduces the portion of each frame or packet available to the application payload and may cause fragmentation or require a smaller payload when the total exceeds the path's maximum transmission unit.

## 105.16 Describe the following routing protocols

### Interior Gateway

An Interior Gateway Protocol (IGP) exchanges routing information within a single autonomous system, such as an organization's network. Common IGPs include OSPF, IS-IS, RIP, and EIGRP.

### Exterior Gateway

An exterior gateway protocol exchanges routing information between autonomous systems. Border Gateway Protocol (BGP) is the exterior gateway protocol used to select and advertise routes between networks on the Internet; the capitalized name Exterior Gateway Protocol also refers to an older, now-obsolete protocol that preceded BGP.

## 105.17 Define a VLAN

A virtual local area network (VLAN) logically separates devices into distinct Layer 2 broadcast domains even when they share physical switches. VLANs improve segmentation and management, and communication between different VLANs normally requires routing.

## 105.18 Describe IPv4 and IPv6

IPv4 uses 32-bit addresses and supports about 4.3 billion unique address values, which led to widespread use of private addressing and network address translation. IPv6 uses 128-bit addresses, provides a vastly larger address space, simplifies parts of the header, and adds features such as address autoconfiguration; the two versions are not directly interchangeable and often coexist through dual-stack or transition mechanisms.

## 105.19 Describe the concepts, relationships, and units of

### Latency

Latency is the time required for data to travel from a source to a destination, commonly measured in milliseconds. It may be measured one way or as round-trip time and is affected by propagation distance, processing, transmission, and queuing delays.

### Throughput

Throughput is the rate at which data is successfully transferred, commonly measured in bits per second. The rate of useful application payload alone is more specifically called goodput. High available bandwidth can support high throughput, but latency, congestion, protocol overhead, errors, and endpoint performance may reduce the rate actually achieved.

## 105.20 Describe connection-oriented communication protocols

Connection-oriented protocols establish and maintain a logical session before or while exchanging application data. They commonly track state and may provide sequencing, acknowledgments, retransmission, flow control, and orderly connection termination; TCP is the standard example.

## 105.21 Describe connectionless communication protocols

Connectionless protocols send independent messages without first establishing a persistent session or guaranteeing delivery, order, or duplicate suppression. This reduces overhead and latency, while applications add reliability when needed; UDP is the standard example.

## 105.22 Describe different methods of establishing and maintaining communication sessions

Sessions may be established through a handshake that negotiates identities, addresses, capabilities, encryption, and initial state, or they may be created implicitly when the first message is sent. They can be maintained with sequence numbers, acknowledgments, keepalive or heartbeat messages, timeouts, tokens, and stored state, then ended through an explicit close exchange or expiration after inactivity.

## 105.23 Describe common communication media

### Wireless

Wireless media carry signals through free space using radio, microwave, infrared, or similar electromagnetic energy. They support mobility and flexible deployment but are affected by range, interference, obstacles, shared spectrum, and the need for strong access controls and encryption.

### Wired

Wired media carry signals through physical cables such as twisted-pair copper, coaxial cable, or fiber optic cable. They generally provide predictable performance and physical containment, while installation cost, distance limits, cable damage, and port availability affect their use.

## 105.24 Describe the following cryptographic terms

### Symmetric

Symmetric encryption uses a shared secret key to encrypt and decrypt data. It is fast and well suited to protecting large amounts of data, but the key must be distributed and stored securely.

### Asymmetric

Asymmetric cryptography uses a mathematically related public key and private key. Depending on the scheme, the public key may encrypt data or verify signatures while the private key decrypts data or creates signatures, enabling encryption, authentication, signatures, and key establishment without first sharing a secret key.

### Homomorphic

Homomorphic encryption permits specified computations to be performed on encrypted data without first decrypting it. When the result is decrypted, it corresponds to the result of performing those computations on the original plaintext.

### Polymorphic

Polymorphic cryptography is not a single standardized cryptographic primitive. The term is used for designs that change elements such as keys, algorithms, or ciphertext representation over time while preserving authorized access to the data, with the goal of reducing stable patterns available to an attacker.

### Hashing

Hashing applies a one-way function to data to produce a fixed-length digest. Cryptographic hashes are designed so that small input changes produce very different digests and it is computationally difficult to reverse the digest or find two inputs with the same value.

### Digital Signatures

A digital signature uses a private key to sign data and a corresponding public key to verify the signature. It provides evidence of data integrity, signer authenticity, and, when properly managed, support for non-repudiation.

### Digital Certificates

A digital certificate binds an identity to a public key and is digitally signed by a trusted certificate authority or other issuer. Systems use certificates to authenticate parties and establish trust for services such as TLS, code signing, and secure email.

### S/MIME

Secure/Multipurpose Internet Mail Extensions (S/MIME) is a standard for digitally signing and encrypting email using public-key certificates. It can provide message confidentiality, integrity, sender authentication, and signature-based non-repudiation.

## 105.25 Describe steganography

Steganography conceals the existence of information by embedding it within another medium, such as an image, audio file, video, or document. Unlike encryption, which hides content, steganography primarily hides the presence of the message and may be combined with encryption.

## 105.26 Define the pillars of Information Security

### Confidentiality

Confidentiality ensures that information is accessible only to authorized people, processes, or systems. Controls such as access restrictions, encryption, and data classification help prevent unauthorized disclosure.

### Integrity

Integrity ensures that information and systems remain accurate, complete, and protected from unauthorized or accidental modification. Hashes, digital signatures, validation, access controls, and audit logs help detect or prevent changes.

### Availability

Availability ensures that authorized users can access information and services when needed. Redundancy, backups, capacity planning, maintenance, monitoring, and resilience against failures or attacks support availability.

## 105.27 Define the following Information Security terms

### Non-repudiation

Non-repudiation provides evidence that an action or communication occurred and is attributable to a particular party, making a credible denial difficult. Digital signatures, trusted timestamps, and protected audit records can support it.

### Access control

Access control is the process of granting or denying requests to use information, systems, or other resources according to an established policy. It combines identities, permissions, enforcement mechanisms, and accountability records.

### Authentication

Authentication verifies that a claimed identity is genuine, commonly through something a user knows, has, or is. Systems may combine multiple factors to increase confidence in the identity.

### Authorization

Authorization determines what an authenticated identity is allowed to access or do. It is enforced through permissions, roles, attributes, policies, or other rules after identity has been established.

## 105.28 Describe the following Distributed Systems

### Peer-to-peer networking

Peer-to-peer networking allows participating systems to act as both clients and servers, sharing resources directly without requiring every exchange to pass through a central service. It can improve distribution and resilience but complicates discovery, trust, coordination, and security.

### Blockchain

A blockchain is a distributed, append-oriented ledger in which records are grouped into cryptographically linked blocks and participants use a consensus method to agree on valid updates. Its design makes past records difficult to alter without detection, although performance, privacy, and governance depend on the implementation.

### Smart contracts

Smart contracts are programs stored and executed within a blockchain or distributed-ledger environment. They automatically apply predefined rules to transactions, but their results depend on the correctness of their code and the reliability of any external data they use.
